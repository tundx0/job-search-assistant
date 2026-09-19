import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { calculateResumeStrengthWithAI } from "@/lib/ai/resume-scoring";
import { retrieveFile } from "@/lib/storage";
import {
  parseStorageLocationFromUrl,
  resolveJobOwnedStorageKey,
} from "@/lib/storage/paths";

/**
 * Calculate and update the strength score for an existing job application
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const param = await params;
    const jobId = param.id;

    // Get the job application
    const jobApplication = await prisma.jobApplication.findUnique({
      where: {
        id: jobId,
      },
    });

    if (!jobApplication) {
      return NextResponse.json(
        { message: "Job application not found" },
        { status: 404 }
      );
    }

    // Check if the user owns this job application
    if (jobApplication.userId !== user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    // Check if we have a JSON resume to score
    if (!jobApplication.tailoredResumeJSON) {
      return NextResponse.json(
        { message: "No JSON resume found for this job application" },
        { status: 400 }
      );
    }

    let resumeJSON;
    try {
      const stored = jobApplication.tailoredResumeJSON;
      const location = parseStorageLocationFromUrl(stored);

      if (location) {
        const ownedKey = resolveJobOwnedStorageKey(
          location.key,
          user.id,
          jobId,
          { allowAdmin: user.role === "ADMIN" }
        );
        if (!ownedKey) {
          return NextResponse.json(
            { message: "Unauthorized" },
            { status: 403 }
          );
        }
        resumeJSON = JSON.parse(
          await retrieveFile(ownedKey, {
            provider: location.provider,
            bucket: location.bucket,
          })
        );
      } else if (stored.trim().startsWith("{")) {
        resumeJSON = JSON.parse(stored);
      } else {
        throw new Error("Unsupported resume JSON location");
      }
    } catch (error) {
      console.error("Error getting or parsing JSON resume:", error);
      return NextResponse.json(
        { message: `Error processing resume: ${(error as Error).message}` },
        { status: 400 }
      );
    }

    // Calculate the strength score and get detailed insights
    const insights = await calculateResumeStrengthWithAI(
      resumeJSON,
      jobApplication.jobDescription,
      jobApplication.jobTitle,
      user.id
    );

    // First, update the job application with just the score
    const updatedJobApplication = await prisma.jobApplication.update({
      where: {
        id: jobId,
      },
      data: {
        strengthScore: insights.score,
      },
    });

    const resumeInsight = await prisma.resumeInsight.upsert({
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

    return NextResponse.json({
      message: "Strength score and insights calculated successfully",
      strengthScore: insights.score,
      insights: resumeInsight,
      jobApplication: updatedJobApplication,
    });
  } catch (error) {
    console.error("Error calculating strength score:", error);

    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
