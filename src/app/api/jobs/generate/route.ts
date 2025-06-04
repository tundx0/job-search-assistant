import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { generateResume, generateCoverLetter } from "@/lib/ai/generation";
import {
  generateResumeJSON,
  convertResumeJSONToText,
  ResumeJSON,
} from "@/lib/ai/simple-json-generation";
import { storeFile, generatePDF } from "@/lib/storage";
import { calculateResumeStrengthWithAI } from "@/lib/ai/resume-scoring";
import * as z from "zod";

// Define contact info schema
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

// AI-based resume strength scoring is now used instead of keyword-based approach

export async function POST(req: Request) {
  try {
    const session = await getCurrentUser(); // session.user is from NextAuth

    if (!session || !session.id) {
      // Check session and session.id
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Fetch the full user profile from the database using the id from the session
    // Define a type that matches only the fields we're selecting
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

    // Use the specific type that matches our selection
    const userFromDb: UserProfile | null = await prisma.user.findUnique({
      where: { id: session.id }, // Use session.id
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
        // Include other fields if they are needed by generation logic later, e.g., bio, experience, education, skills
        // For now, only selecting fields relevant to contactInfo and basic identification
      },
    });

    if (!userFromDb) {
      return NextResponse.json(
        { message: "User not found in database" },
        { status: 404 }
      );
    }

    const body = await req.json();

    // Validate input data
    const {
      jobId,
      format,
      contactInfo: requestContactInfo,
    } = generateSchema.parse(body);

    // Construct effective contact information using the full user profile from the database
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

    if (jobApplication.userId !== userFromDb.id) {
      // Corrected to use userFromDb.id
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    // Generate resume and cover letter
    let resume: string;
    let resumeJSON: ResumeJSON | null = null;

    console.log(format);

    if (format === "json") {
      // Generate JSON resume with contact info if provided
      resumeJSON = await generateResumeJSON(
        userFromDb.id, // Use id from userFromDb
        jobApplication.jobDescription,
        jobApplication.jobTitle,
        jobApplication.companyName,
        effectiveContactInfo, // Pass the merged contact info
        userFromDb.atsOptimizationEnabled ?? undefined // Pass the user's ATS optimization preference
      );

      // Convert JSON to text for storage and PDF generation
      resume = convertResumeJSONToText(resumeJSON);
    } else {
      // Generate traditional text resume
      resume = await generateResume(
        userFromDb.id, // Use id from userFromDb
        jobApplication.jobDescription,
        jobApplication.jobTitle,
        jobApplication.companyName,
        effectiveContactInfo, // Pass the merged contact info
        userFromDb.atsOptimizationEnabled ?? undefined // Pass the user's ATS optimization preference
      );
    }

    const coverLetter = await generateCoverLetter(
      userFromDb.id, // Use id from userFromDb
      jobApplication.jobDescription,
      jobApplication.jobTitle,
      jobApplication.companyName
    );

    // Store the cover letter as a public file
    const coverLetterFile = await storeFile(
      coverLetter,
      `cover-letter-${jobId}.txt`,
      { public: true } // Set files as public
    );
    const coverLetterUrl = coverLetterFile.url;

    // If we have JSON resume data, store it as well
    let resumeJSONUrl = null;
    if (resumeJSON) {
      const resumeJSONFile = await storeFile(
        JSON.stringify(resumeJSON, null, 2),
        `resume-${jobId}.json`,
        { public: true } // Set files as public
      );
      resumeJSONUrl = resumeJSONFile.url;
    }

    // Calculate resume strength score using AI for more accurate assessment
    let strengthScore = 50; // Default score
    try {
      // First check if we already have insights for this job application
      const existingInsight = await prisma.resumeInsight.findUnique({
        where: {
          jobApplicationId: jobId,
        },
      });

      // Also check if the job application already has a strength score
      const existingJobApp = await prisma.jobApplication.findUnique({
        where: {
          id: jobId,
        },
        select: {
          strengthScore: true,
        },
      });

      // If we already have insights and a strength score, use the existing score
      if (existingInsight && existingJobApp?.strengthScore) {
        console.log(
          "Using existing strength score:",
          existingJobApp.strengthScore
        );
        strengthScore = existingJobApp.strengthScore;
      }
      // Only calculate new insights if we don't already have them and have resumeJSON
      else if (resumeJSON) {
        console.log("Calculating resume strength score with AI...");
        // The function now returns a ResumeInsightData object instead of just a number
        const insights = await calculateResumeStrengthWithAI(
          resumeJSON,
          jobApplication.jobDescription,
          jobApplication.jobTitle
        );

        // Extract the score
        strengthScore = insights.score;

        console.log(`AI-based strength score: ${strengthScore}`);

        // Store the full insights in the database
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
          console.log("Resume insights stored successfully");
        } catch (insightError) {
          console.error("Error storing resume insights:", insightError);
          // Continue with the process even if insights storage fails
        }
      } else {
        console.log("No JSON resume available, using default score");
      }
    } catch (error) {
      console.error(
        "Error calculating strength score with AI, using default score:",
        error
      );
      // Using default score of 50 since we removed the fallback function
    }

    // Generate and store ATS-compatible PDF for resume only
    // If we have JSON resume data, use it for PDF generation
    // For resumeJSON, we pass it as is - the generatePDF function already sets public: true internally
    const resumePdfUrl = resumeJSON
      ? await generatePDF(resume, `resume-${jobId}.pdf`, resumeJSON)
      : await generatePDF(resume, `resume-${jobId}.pdf`, { public: true });

    // We no longer generate PDFs for cover letters as requested

    // Variable to store the updated job application
    let updatedJobApplication;

    try {
      // Update with only PDF and JSON fields for resume, and text for cover letter
      updatedJobApplication = await prisma.jobApplication.update({
        where: {
          id: jobId,
        },
        data: {
          tailoredResume: resumePdfUrl, // Use PDF URL as the main resume URL
          coverLetter: coverLetterUrl,
          tailoredResumePdf: resumePdfUrl,
          coverLetterPdf: null, // No longer storing cover letter PDFs
          tailoredResumeJSON: resumeJSONUrl,
          status: "submitted",
          strengthScore: strengthScore, // Add the calculated strength score
        },
      });
    } catch (error) {
      // If that fails (likely because the schema hasn't been updated yet),
      // fall back to updating without PDF fields
      console.error("Error updating job application with PDF fields:", error);

      updatedJobApplication = await prisma.jobApplication.update({
        where: {
          id: jobId,
        },
        data: {
          tailoredResume: resumePdfUrl, // Use PDF URL as the main resume URL
          coverLetter: coverLetterUrl,
          status: "submitted",
        },
      });
    }

    // Create a response object with the data we know exists
    const responseData = {
      message: "Documents generated successfully",
      jobApplication: {
        id: jobId,
        status: "submitted",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any, // Use 'as any' to bypass TypeScript checking
    };

    // Add data from the updated job application to the response
    if (updatedJobApplication) {
      responseData.jobApplication.id = updatedJobApplication.id;
      responseData.jobApplication.status = updatedJobApplication.status;
    }

    // Include the cover letter URL
    responseData.jobApplication.coverLetter = coverLetterUrl;

    // Always include the PDF URL and strength score in the response
    responseData.jobApplication.tailoredResumePdf = resumePdfUrl;
    responseData.jobApplication.strengthScore = strengthScore; // Include strength score

    // Include JSON URL if available
    if (resumeJSONUrl) {
      responseData.jobApplication.tailoredResumeJSON = resumeJSONUrl;
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Document generation error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid input data", errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
