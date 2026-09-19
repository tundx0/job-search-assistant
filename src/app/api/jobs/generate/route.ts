import { NextResponse } from "next/server";
import * as z from "zod";

import { getCurrentUser } from "@/lib/auth/session";
import {
  generateApplicationDocuments,
  JobNotFoundError,
  UserNotFoundError,
} from "@/lib/jobs/generate-documents";
import { isMissingApiKeyError, MISSING_API_KEY_MESSAGE } from "@/lib/ai/errors";

const contactInfoSchema = z.object({
  location: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email(),
  linkedin: z.string().optional(),
  github: z.string().optional(),
  website: z.string().optional(),
});

const generateSchema = z.object({
  jobId: z.string().uuid(),
  format: z.enum(["text", "json"]).optional().default("json"),
  contactInfo: contactInfoSchema.optional(),
});

function jsonError(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

/**
 * HTTP wrapper over the shared generation pipeline. The pipeline itself lives
 * in lib/jobs so the MCP server runs exactly the same code path.
 */
export async function POST(req: Request) {
  try {
    const session = await getCurrentUser();

    if (!session?.id) {
      return jsonError("Unauthorized", 401);
    }

    const { jobId, format, contactInfo } = generateSchema.parse(await req.json());

    const result = await generateApplicationDocuments({
      userId: session.id,
      jobId,
      format,
      contactInfo,
    });

    return NextResponse.json({
      message: "Documents generated successfully",
      jobApplication: {
        id: result.jobId,
        status: result.status,
        coverLetter: result.coverLetterKey,
        tailoredResumePdf: result.resumePdfUrl,
        strengthScore: result.strengthScore,
        ...(result.resumeJsonUrl
          ? { tailoredResumeJSON: result.resumeJsonUrl }
          : {}),
      },
    });
  } catch (error) {
    if (error instanceof JobNotFoundError) {
      return jsonError("Job application not found", 404);
    }

    if (error instanceof UserNotFoundError) {
      return jsonError("User not found in database", 404);
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid input data", errors: error.errors },
        { status: 400 }
      );
    }

    if (isMissingApiKeyError(error)) {
      return jsonError(error.message || MISSING_API_KEY_MESSAGE, 400);
    }

    if (
      error instanceof Error &&
      /OPENAI_API_KEY environment variable is missing/i.test(error.message)
    ) {
      return jsonError(MISSING_API_KEY_MESSAGE, 400);
    }

    console.error("Document generation error:", error);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}
