import { prisma } from "@/lib/db/prisma";
import { generateResume, generateCoverLetter } from "@/lib/ai/generation";
import {
  generateResumeJSON,
  convertResumeJSONToText,
  type ResumeJSON,
} from "@/lib/ai/simple-json-generation";
import { storeFile, generatePDF } from "@/lib/storage";
import { getUserStoragePrefix } from "@/lib/storage/paths";
import { calculateResumeStrengthWithAI } from "@/lib/ai/resume-scoring";

export interface ContactInfo {
  email: string;
  location?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

export interface GenerateDocumentsArgs {
  userId: string;
  jobId: string;
  format?: "text" | "json";
  /** Caller-supplied overrides; anything omitted falls back to the profile. */
  contactInfo?: Partial<ContactInfo>;
  /**
   * Recompute the strength score against the resume just produced. Reusing a
   * previous score after regenerating would describe a document that no
   * longer exists.
   */
  rescore?: boolean;
}

export interface GenerateDocumentsResult {
  jobId: string;
  status: string;
  resumeKey: string;
  coverLetterKey: string;
  resumePdfUrl: string;
  resumeJsonUrl: string | null;
  /** Null when scoring failed or was not attempted. Never a placeholder. */
  strengthScore: number | null;
}

export class JobNotFoundError extends Error {
  constructor() {
    super("Job application not found");
    this.name = "JobNotFoundError";
  }
}

export class UserNotFoundError extends Error {
  constructor() {
    super("User not found");
    this.name = "UserNotFoundError";
  }
}

const USER_FIELDS = {
  id: true,
  email: true,
  name: true,
  location: true,
  phone: true,
  linkedin: true,
  github: true,
  website: true,
  atsOptimizationEnabled: true,
} as const;

/**
 * Generates a tailored resume and cover letter for one application, stores
 * them, scores the result and records everything against the application.
 *
 * Extracted from the HTTP route so the route and the MCP server share one
 * implementation rather than maintaining the pipeline twice.
 */
export async function generateApplicationDocuments(
  args: GenerateDocumentsArgs
): Promise<GenerateDocumentsResult> {
  const { userId, jobId, format = "json", rescore = false } = args;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: USER_FIELDS,
  });

  if (!user) throw new UserNotFoundError();

  // Ownership is part of the lookup, so a foreign id is indistinguishable
  // from a missing one.
  const jobApplication = await prisma.jobApplication.findFirst({
    where: { id: jobId, userId },
  });

  if (!jobApplication) throw new JobNotFoundError();

  const contactInfo: ContactInfo = {
    email: args.contactInfo?.email || user.email,
    location: pick(args.contactInfo?.location, user.location),
    phone: pick(args.contactInfo?.phone, user.phone),
    linkedin: pick(args.contactInfo?.linkedin, user.linkedin),
    github: pick(args.contactInfo?.github, user.github),
    website: pick(args.contactInfo?.website, user.website),
  };

  const storageOptions = {
    path: getUserStoragePrefix(user.id),
    public: false as const,
  };

  let resumeText: string;
  let resumeJSON: ResumeJSON | null = null;

  if (format === "json") {
    resumeJSON = await generateResumeJSON(
      user.id,
      jobApplication.jobDescription,
      jobApplication.jobTitle,
      jobApplication.companyName,
      contactInfo,
      user.atsOptimizationEnabled ?? undefined
    );
    resumeText = convertResumeJSONToText(resumeJSON);
  } else {
    resumeText = await generateResume(
      user.id,
      jobApplication.jobDescription,
      jobApplication.jobTitle,
      jobApplication.companyName,
      contactInfo,
      user.atsOptimizationEnabled ?? undefined
    );
  }

  const coverLetter = await generateCoverLetter(
    user.id,
    jobApplication.jobDescription,
    jobApplication.jobTitle,
    jobApplication.companyName
  );

  const coverLetterFile = await storeFile(
    coverLetter,
    `cover-letter-${jobId}.txt`,
    { ...storageOptions, contentType: "text/plain; charset=utf-8" }
  );

  let resumeJsonUrl: string | null = null;
  if (resumeJSON) {
    const resumeJsonFile = await storeFile(
      JSON.stringify(resumeJSON, null, 2),
      `resume-${jobId}.json`,
      { ...storageOptions, contentType: "application/json" }
    );
    resumeJsonUrl = resumeJsonFile.url;
  }

  const resumePdfUrl = await generatePDF(
    resumeText,
    `resume-${jobId}.pdf`,
    resumeJSON ?? undefined,
    storageOptions
  );

  const strengthScore = await resolveStrengthScore({
    userId: user.id,
    jobId,
    resumeJSON,
    jobDescription: jobApplication.jobDescription,
    jobTitle: jobApplication.jobTitle,
    forceRescore: rescore,
  });

  const updated = await prisma.jobApplication.update({
    where: { id: jobId },
    data: {
      tailoredResume: resumePdfUrl,
      coverLetter: coverLetterFile.url,
      tailoredResumePdf: resumePdfUrl,
      coverLetterPdf: null,
      tailoredResumeJSON: resumeJsonUrl,
      status: "submitted",
      // Left untouched when scoring failed, rather than overwritten with a
      // placeholder that cannot be told apart from a real result.
      ...(strengthScore === null ? {} : { strengthScore }),
    },
  });

  return {
    jobId,
    status: updated.status,
    resumeKey: resumePdfUrl,
    coverLetterKey: coverLetterFile.url,
    resumePdfUrl,
    resumeJsonUrl,
    strengthScore,
  };
}

/**
 * Scores an existing resume against its posting and stores the insight.
 */
export async function scoreApplicationResume(args: {
  userId: string;
  jobId: string;
}) {
  const jobApplication = await prisma.jobApplication.findFirst({
    where: { id: args.jobId, userId: args.userId },
  });

  if (!jobApplication) throw new JobNotFoundError();

  const resumeJSON = await loadStoredResumeJson(jobApplication.tailoredResumeJSON);

  const strengthScore = await resolveStrengthScore({
    userId: args.userId,
    jobId: args.jobId,
    resumeJSON,
    jobDescription: jobApplication.jobDescription,
    jobTitle: jobApplication.jobTitle,
    forceRescore: true,
  });

  if (strengthScore !== null) {
    await prisma.jobApplication.update({
      where: { id: args.jobId },
      data: { strengthScore },
    });
  }

  const insight = await prisma.resumeInsight.findUnique({
    where: { jobApplicationId: args.jobId },
  });

  return {
    strengthScore,
    insight: insight
      ? {
          overallFeedback: insight.overallFeedback,
          strengths: insight.strengths,
          improvementAreas: insight.improvementAreas,
          missingKeywords: insight.missingKeywords,
          skillGaps: insight.skillGaps,
        }
      : null,
  };
}

/**
 * Returns the strength score, or null when it could not be determined.
 *
 * The previous behaviour defaulted to 50 and wrote that to the database, so a
 * scoring failure was indistinguishable from a genuine middling score.
 */
async function resolveStrengthScore(args: {
  userId: string;
  jobId: string;
  resumeJSON: ResumeJSON | null;
  jobDescription: string;
  jobTitle: string;
  forceRescore: boolean;
}): Promise<number | null> {
  if (!args.forceRescore) {
    const [existingInsight, existingApp] = await Promise.all([
      prisma.resumeInsight.findUnique({ where: { jobApplicationId: args.jobId } }),
      prisma.jobApplication.findUnique({
        where: { id: args.jobId },
        select: { strengthScore: true },
      }),
    ]);

    if (existingInsight && existingApp?.strengthScore != null) {
      return existingApp.strengthScore;
    }
  }

  if (!args.resumeJSON) return null;

  try {
    const insights = await calculateResumeStrengthWithAI(
      args.resumeJSON,
      args.jobDescription,
      args.jobTitle,
      args.userId
    );

    await prisma.resumeInsight.upsert({
      where: { jobApplicationId: args.jobId },
      create: { jobApplicationId: args.jobId, ...insightFields(insights) },
      update: insightFields(insights),
    });

    return insights.score;
  } catch (error) {
    console.error("Resume scoring failed:", error);
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function insightFields(insights: any) {
  return {
    overallFeedback: insights.overallFeedback,
    improvementAreas: insights.improvementAreas || [],
    strengths: insights.strengths || [],
    missingKeywords: insights.missingKeywords || [],
    skillGaps: insights.skillGaps || [],
    formatSuggestions: joinLines(insights.formatSuggestions),
    contentSuggestions: joinLines(insights.contentSuggestions),
    summaryFeedback: insights.summaryFeedback || null,
    experienceFeedback: insights.experienceFeedback || null,
    educationFeedback: insights.educationFeedback || null,
    skillsFeedback: insights.skillsFeedback || null,
  };
}

function joinLines(value: unknown): string | null {
  if (Array.isArray(value)) return value.join("\n");
  return (value as string) || null;
}

async function loadStoredResumeJson(
  location: string | null
): Promise<ResumeJSON | null> {
  if (!location) return null;

  try {
    const { retrieveFile } = await import("@/lib/storage");
    const { storageKeyFromLocation } = await import("./storage-location");
    const key = storageKeyFromLocation(location);
    if (!key) return null;

    const text = await retrieveFile(key);
    return JSON.parse(text) as ResumeJSON;
  } catch (error) {
    console.error("Could not read the stored resume JSON:", error);
    return null;
  }
}

function pick(override: string | undefined, fallback: string | null) {
  return override !== undefined ? override : fallback ?? undefined;
}
