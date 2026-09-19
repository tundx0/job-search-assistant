import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { generateResume, generateCoverLetter } from "@/lib/ai/generation";
import {
  generateResumeJSON,
  convertResumeJSONToText,
  ResumeJSON,
} from "@/lib/ai/simple-json-generation";
import {
  storeFile,
  generatePDF,
  getUserStoragePrefix,
} from "@/lib/storage";
import { calculateResumeStrengthWithAI } from "@/lib/ai/resume-scoring";
import {
  isMissingApiKeyError,
  MISSING_API_KEY_MESSAGE,
} from "@/lib/ai/errors";
import * as z from "zod";

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

export async function POST(req: Request) {
  try {
    const session = await getCurrentUser();

    if (!session || !session.id) {
      return jsonError("Unauthorized", 401);
    }

    type UserProfile = {
      id: string;
      email: string;
      name: string;
      location: string | null;
      phone: string | null;
      linkedin: string | null;
      github: string | null;
      website: string | null;
      atsOptimizationEnabled: boolean | null;
    };

    const userFromDb: UserProfile | null = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        email: true,
        name: true,
        location: true,
        phone: true,
        linkedin: true,
        github: true,
        website: true,
        atsOptimizationEnabled: true,
      },
    });

    if (!userFromDb) {
      return jsonError("User not found in database", 404);
    }

    const body = await req.json();

    const {
      jobId,
      format,
      contactInfo: requestContactInfo,
    } = generateSchema.parse(body);

    const effectiveContactInfo: z.infer<typeof contactInfoSchema> = {
      email: requestContactInfo?.email || userFromDb.email,
      location:
        requestContactInfo?.location !== undefined
          ? requestContactInfo.location
          : userFromDb.location ?? undefined,
      phone:
        requestContactInfo?.phone !== undefined
          ? requestContactInfo.phone
          : userFromDb.phone ?? undefined,
      linkedin:
        requestContactInfo?.linkedin !== undefined
          ? requestContactInfo.linkedin
          : userFromDb.linkedin ?? undefined,
      github:
        requestContactInfo?.github !== undefined
          ? requestContactInfo.github
          : userFromDb.github ?? undefined,
      website:
        requestContactInfo?.website !== undefined
          ? requestContactInfo.website
          : userFromDb.website ?? undefined,
    };

    const jobApplication = await prisma.jobApplication.findUnique({
      where: {
        id: jobId,
      },
    });

    if (!jobApplication) {
      return jsonError("Job application not found", 404);
    }

    if (jobApplication.userId !== userFromDb.id) {
      return jsonError("Unauthorized", 403);
    }

    const userStoragePath = getUserStoragePrefix(userFromDb.id);
    const privateStorageOptions = {
      path: userStoragePath,
      public: false as const,
    };

    let resume: string;
    let resumeJSON: ResumeJSON | null = null;

    if (format === "json") {
      resumeJSON = await generateResumeJSON(
        userFromDb.id,
        jobApplication.jobDescription,
        jobApplication.jobTitle,
        jobApplication.companyName,
        effectiveContactInfo,
        userFromDb.atsOptimizationEnabled ?? undefined
      );

      resume = convertResumeJSONToText(resumeJSON);
    } else {
      resume = await generateResume(
        userFromDb.id,
        jobApplication.jobDescription,
        jobApplication.jobTitle,
        jobApplication.companyName,
        effectiveContactInfo,
        userFromDb.atsOptimizationEnabled ?? undefined
      );
    }

    const coverLetter = await generateCoverLetter(
      userFromDb.id,
      jobApplication.jobDescription,
      jobApplication.jobTitle,
      jobApplication.companyName
    );

    const coverLetterFile = await storeFile(
      coverLetter,
      `cover-letter-${jobId}.txt`,
      { ...privateStorageOptions, contentType: "text/plain; charset=utf-8" }
    );
    const coverLetterUrl = coverLetterFile.url;

    let resumeJSONUrl = null;
    if (resumeJSON) {
      const resumeJSONFile = await storeFile(
        JSON.stringify(resumeJSON, null, 2),
        `resume-${jobId}.json`,
        { ...privateStorageOptions, contentType: "application/json" }
      );
      resumeJSONUrl = resumeJSONFile.url;
    }

    let strengthScore = 50;
    try {
      const existingInsight = await prisma.resumeInsight.findUnique({
        where: {
          jobApplicationId: jobId,
        },
      });

      const existingJobApp = await prisma.jobApplication.findUnique({
        where: {
          id: jobId,
        },
        select: {
          strengthScore: true,
        },
      });

      if (existingInsight && existingJobApp?.strengthScore) {
        strengthScore = existingJobApp.strengthScore;
      } else if (resumeJSON) {
        const insights = await calculateResumeStrengthWithAI(
          resumeJSON,
          jobApplication.jobDescription,
          jobApplication.jobTitle,
          userFromDb.id
        );

        strengthScore = insights.score;

        try {
          await prisma.resumeInsight.upsert({
            where: {
              jobApplicationId: jobId,
            },
            create: {
              jobApplicationId: jobId,
              overallFeedback: insights.overallFeedback,
              improvementAreas: insights.improvementAreas || [],
              strengths: insights.strengths || [],
              missingKeywords: insights.missingKeywords || [],
              skillGaps: insights.skillGaps || [],
              formatSuggestions: Array.isArray(insights.formatSuggestions)
                ? insights.formatSuggestions.join("\n")
                : insights.formatSuggestions || null,
              contentSuggestions: Array.isArray(insights.contentSuggestions)
                ? insights.contentSuggestions.join("\n")
                : insights.contentSuggestions || null,
              summaryFeedback: insights.summaryFeedback || null,
              experienceFeedback: insights.experienceFeedback || null,
              educationFeedback: insights.educationFeedback || null,
              skillsFeedback: insights.skillsFeedback || null,
            },
            update: {
              overallFeedback: insights.overallFeedback,
              improvementAreas: insights.improvementAreas || [],
              strengths: insights.strengths || [],
              missingKeywords: insights.missingKeywords || [],
              skillGaps: insights.skillGaps || [],
              formatSuggestions: Array.isArray(insights.formatSuggestions)
                ? insights.formatSuggestions.join("\n")
                : insights.formatSuggestions || null,
              contentSuggestions: Array.isArray(insights.contentSuggestions)
                ? insights.contentSuggestions.join("\n")
                : insights.contentSuggestions || null,
              summaryFeedback: insights.summaryFeedback || null,
              experienceFeedback: insights.experienceFeedback || null,
              educationFeedback: insights.educationFeedback || null,
              skillsFeedback: insights.skillsFeedback || null,
            },
          });
        } catch (insightError) {
          console.error("Error storing resume insights:", insightError);
        }
      }
    } catch (error) {
      if (isMissingApiKeyError(error)) {
        throw error;
      }
      console.error(
        "Error calculating strength score with AI, using default score:",
        error
      );
    }

    const resumePdfUrl = await generatePDF(
      resume,
      `resume-${jobId}.pdf`,
      resumeJSON ?? undefined,
      privateStorageOptions
    );

    let updatedJobApplication;

    try {
      updatedJobApplication = await prisma.jobApplication.update({
        where: {
          id: jobId,
        },
        data: {
          tailoredResume: resumePdfUrl,
          coverLetter: coverLetterUrl,
          tailoredResumePdf: resumePdfUrl,
          coverLetterPdf: null,
          tailoredResumeJSON: resumeJSONUrl,
          status: "submitted",
          strengthScore: strengthScore,
        },
      });
    } catch (error) {
      console.error("Error updating job application with PDF fields:", error);

      updatedJobApplication = await prisma.jobApplication.update({
        where: {
          id: jobId,
        },
        data: {
          tailoredResume: resumePdfUrl,
          coverLetter: coverLetterUrl,
          status: "submitted",
        },
      });
    }

    const responseData = {
      message: "Documents generated successfully",
      jobApplication: {
        id: jobId,
        status: "submitted",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    };

    if (updatedJobApplication) {
      responseData.jobApplication.id = updatedJobApplication.id;
      responseData.jobApplication.status = updatedJobApplication.status;
    }

    responseData.jobApplication.coverLetter = coverLetterUrl;
    responseData.jobApplication.tailoredResumePdf = resumePdfUrl;
    responseData.jobApplication.strengthScore = strengthScore;

    if (resumeJSONUrl) {
      responseData.jobApplication.tailoredResumeJSON = resumeJSONUrl;
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Document generation error:", error);

    if (isMissingApiKeyError(error)) {
      return jsonError(error.message || MISSING_API_KEY_MESSAGE, 400);
    }

    if (
      error instanceof Error &&
      /OPENAI_API_KEY environment variable is missing/i.test(error.message)
    ) {
      return jsonError(MISSING_API_KEY_MESSAGE, 400);
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid input data", errors: error.errors },
        { status: 400 }
      );
    }

    return jsonError("Something went wrong. Please try again.", 500);
  }
}
