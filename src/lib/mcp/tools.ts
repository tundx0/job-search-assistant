import type * as z from "zod4";

import { prisma } from "@/lib/db/prisma";
import { retrieveFile } from "@/lib/storage";
import { storageKeyFromLocation } from "@/lib/jobs/storage-location";

import type { McpAccount } from "./account";
import { McpToolError } from "./errors";
import { toDetail, toListRow } from "./format";
import {
  createApplicationInput,
  generateDocumentsInput,
  getApplicationInput,
  getDocumentInput,
  listApplicationsInput,
  scoreApplicationInput,
  updateStatusInput,
} from "./schemas";
import { MAX_GENERATIONS_PER_PROCESS } from "./config";

/**
 * Billable generations performed by this process. Deliberately module scope:
 * it is a backstop against an agent loop within a single approved tool call,
 * not a durable quota.
 */
let generationsThisProcess = 0;

export function resetGenerationCounterForTests() {
  generationsThisProcess = 0;
}

/**
 * Loads an application the account owns.
 *
 * Ownership is filtered in the query rather than checked afterwards, so a
 * wrong id and someone else's id are indistinguishable to the caller.
 */
async function ownedApplication(account: McpAccount, id: string) {
  const app = await prisma.jobApplication.findFirst({
    where: { id, userId: account.id },
    include: { resumeInsight: true },
  });

  if (!app) {
    throw new McpToolError("not_found", `No application with id ${id}`);
  }

  return app;
}

export async function listApplications(
  account: McpAccount,
  raw: z.input<typeof listApplicationsInput>
) {
  const { status, limit, cursor } = listApplicationsInput.parse(raw);

  const applications = await prisma.jobApplication.findMany({
    where: { userId: account.id, ...(status ? { status } : {}) },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = applications.length > limit;
  const page = hasMore ? applications.slice(0, limit) : applications;

  return {
    applications: page.map(toListRow),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  };
}

export async function getApplication(
  account: McpAccount,
  raw: z.input<typeof getApplicationInput>
) {
  const { id, full } = getApplicationInput.parse(raw);
  return toDetail(await ownedApplication(account, id), { full });
}

export async function createApplication(
  account: McpAccount,
  raw: z.input<typeof createApplicationInput>
) {
  const input = createApplicationInput.parse(raw);

  const app = await prisma.jobApplication.create({
    data: {
      userId: account.id,
      jobTitle: input.jobTitle,
      companyName: input.companyName,
      jobDescription: input.jobDescription,
      jobUrl: input.jobUrl ?? null,
      status: "pending",
      // Documents do not exist until generate_documents runs.
      tailoredResume: "",
      coverLetter: "",
    },
  });

  return {
    ...toListRow(app),
    note: "Created without documents. Call generate_documents to draft them.",
  };
}

export async function updateApplicationStatus(
  account: McpAccount,
  raw: z.input<typeof updateStatusInput>
) {
  const { id, status } = updateStatusInput.parse(raw);
  await ownedApplication(account, id);

  const app = await prisma.jobApplication.update({
    where: { id },
    data: { status },
  });

  return toListRow(app);
}

export async function getDocument(
  account: McpAccount,
  raw: z.input<typeof getDocumentInput>
) {
  const { applicationId, kind } = getDocumentInput.parse(raw);
  const app = await ownedApplication(account, applicationId);

  const location = kind === "resume" ? app.tailoredResume : app.coverLetter;
  if (!location) {
    throw new McpToolError(
      "not_found",
      `This application has no ${kind.replace("_", " ")} yet`,
      "Call generate_documents first."
    );
  }

  const storageKey = storageKeyFromLocation(location);
  if (!storageKey) {
    throw new McpToolError(
      "not_found",
      `The stored ${kind.replace("_", " ")} location could not be resolved`
    );
  }

  try {
    const content = await retrieveFile(storageKey);
    return { applicationId, kind, content };
  } catch {
    // The database row can outlive the stored object, e.g. after a storage
    // provider switch. Report that honestly instead of returning empty text.
    throw new McpToolError(
      "not_found",
      `The stored ${kind.replace("_", " ")} could not be read back`,
      "The document may need regenerating."
    );
  }
}

export async function getProfile(account: McpAccount) {
  const user = await prisma.user.findUnique({
    where: { id: account.id },
    select: {
      name: true,
      email: true,
      bio: true,
      location: true,
      linkedin: true,
      github: true,
      website: true,
      skills: true,
      experience: true,
      education: true,
      projects: true,
      atsOptimizationEnabled: true,
      aiModelPreference: true,
    },
  });

  if (!user) {
    throw new McpToolError("not_found", "Profile not found");
  }

  return {
    ...user,
    // These columns hold JSON strings; parse so the agent gets structure
    // rather than a string it has to parse itself.
    experience: safeParse(user.experience),
    education: safeParse(user.education),
    projects: safeParse(user.projects),
  };
}

function safeParse(value: unknown) {
  if (typeof value !== "string") return value ?? null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

/**
 * Guards shared by the two billable tools.
 *
 * Returns the application, having established that spending is warranted.
 */
async function guardBillable(
  account: McpAccount,
  applicationId: string,
  options: { alreadyDone: boolean; overwrite: boolean; what: string }
) {
  if (generationsThisProcess >= MAX_GENERATIONS_PER_PROCESS) {
    throw new McpToolError(
      "rate_limited",
      `This session has already run ${generationsThisProcess} billable operations`,
      "Start a new session if more are genuinely needed."
    );
  }

  if (options.alreadyDone && !options.overwrite) {
    throw new McpToolError(
      "conflict",
      `This application already has ${options.what}`,
      "Pass regenerate: true (or refresh: true) to spend credit replacing it."
    );
  }

  const keys = await prisma.userApiKey.findMany({
    where: { userId: account.id, isActive: true },
    select: { provider: true },
  });

  if (keys.length === 0 && !process.env.OPENAI_API_KEY) {
    throw new McpToolError(
      "no_api_key",
      "No AI provider key is configured for this account",
      "Add one under Settings → API keys in the web app."
    );
  }
}

export async function generateDocuments(
  account: McpAccount,
  raw: z.input<typeof generateDocumentsInput>
) {
  const { applicationId, format, regenerate } = generateDocumentsInput.parse(raw);
  const app = await ownedApplication(account, applicationId);

  await guardBillable(account, applicationId, {
    alreadyDone: Boolean(app.tailoredResume && app.coverLetter),
    overwrite: regenerate,
    what: "a resume and cover letter",
  });

  generationsThisProcess += 1;

  const { generateApplicationDocuments } = await import(
    "@/lib/jobs/generate-documents"
  );

  const result = await generateApplicationDocuments({
    userId: account.id,
    jobId: applicationId,
    format,
    rescore: true,
  });

  return {
    applicationId,
    strengthScore: result.strengthScore,
    scoringFailed: result.strengthScore === null,
    documents: {
      resume: result.resumeKey,
      coverLetter: result.coverLetterKey,
      resumePdf: result.resumePdfUrl,
    },
  };
}

export async function scoreApplication(
  account: McpAccount,
  raw: z.input<typeof scoreApplicationInput>
) {
  const { applicationId, refresh } = scoreApplicationInput.parse(raw);
  const app = await ownedApplication(account, applicationId);

  if (!app.tailoredResume) {
    throw new McpToolError(
      "not_found",
      "This application has no resume to score",
      "Call generate_documents first."
    );
  }

  if (app.strengthScore !== null && !refresh) {
    return {
      applicationId,
      strengthScore: app.strengthScore,
      cached: true,
      insight: toDetail(app).insight,
    };
  }

  await guardBillable(account, applicationId, {
    alreadyDone: false,
    overwrite: true,
    what: "a score",
  });

  generationsThisProcess += 1;

  const { scoreApplicationResume } = await import("@/lib/jobs/generate-documents");
  const result = await scoreApplicationResume({
    userId: account.id,
    jobId: applicationId,
  });

  return {
    applicationId,
    strengthScore: result.strengthScore,
    scoringFailed: result.strengthScore === null,
    cached: false,
    insight: result.insight,
  };
}
