import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { deleteFile } from "@/lib/storage";

export async function GET(
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

    if (jobApplication.userId !== user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json(jobApplication);
  } catch (error) {
    console.error("Job application fetch error:", error);

    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const body = await req.json();

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

    if (jobApplication.userId !== user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const updatedJobApplication = await prisma.jobApplication.update({
      where: {
        id: jobId,
      },
      data: {
        status: body.status || jobApplication.status,
        jobTitle: body.jobTitle || jobApplication.jobTitle,
        companyName: body.companyName || jobApplication.companyName,
        jobDescription: body.jobDescription || jobApplication.jobDescription,
      },
    });

    return NextResponse.json({
      message: "Job application updated successfully",
      jobApplication: updatedJobApplication,
    });
  } catch (error) {
    console.error("Job application update error:", error);

    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    if (jobApplication.userId !== user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const filesToDelete = [
      `resume-${jobId}.json`,
      `resume-${jobId}.pdf`,
      `cover-letter-${jobId}.txt`,
      `users/${user.id}/resume-${jobId}.json`,
      `users/${user.id}/resume-${jobId}.pdf`,
      `users/${user.id}/cover-letter-${jobId}.txt`,
    ];

    const deletePromises = filesToDelete.map(async (fileKey) => {
      try {
        await deleteFile(fileKey);
        console.log(`Deleted file: ${fileKey}`);
      } catch (error) {
        console.error(`Error deleting file ${fileKey}:`, error);
      }
    });

    await prisma.jobApplication.delete({
      where: {
        id: jobId,
      },
    });

    await Promise.allSettled(deletePromises);

    return NextResponse.json({
      message: "Job application deleted successfully",
    });
  } catch (error) {
    console.error("Job application deletion error:", error);

    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
