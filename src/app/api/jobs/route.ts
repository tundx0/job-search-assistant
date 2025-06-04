import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import * as z from "zod";

const jobSubmissionSchema = z.object({
  jobTitle: z.string().min(2, { message: "Job title is required" }),
  companyName: z.string().min(2, { message: "Company name is required" }),
  jobDescription: z
    .string()
    .min(10, { message: "Job description is required and should be detailed" }),
});

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Validate input data
    const { jobTitle, companyName, jobDescription } =
      jobSubmissionSchema.parse(body);

    // Verify that the user exists in the database
    const dbUser = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
    });

    if (!dbUser) {
      console.error(`User with ID ${user.id} not found in database`);
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Create job application with pending status
    const jobApplication = await prisma.jobApplication.create({
      data: {
        jobTitle,
        companyName,
        jobDescription,
        status: "pending",
        userId: dbUser.id, // Use the verified user ID from the database
        // Initially set empty strings for resume and cover letter
        // They will be updated after generation
        tailoredResume: "",
        coverLetter: "",
      },
    });

    // Return the job application
    return NextResponse.json(
      {
        message: "Job application created successfully",
        id: jobApplication.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Job application creation error:", error);

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
