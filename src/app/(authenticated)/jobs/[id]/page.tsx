import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { Button } from "@/components/ui/button";
import { JobDetail } from "@/components/jobs/job-detail";
import { JobApplicationStatus } from "@/types";

interface JobDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const { id } = await params;

  const jobApplication = await prisma.jobApplication.findUnique({
    where: {
      id,
    },
    include: {
      resumeInsight: true,
    },
  });

  if (!jobApplication || jobApplication.userId !== user.id) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {jobApplication.jobTitle}
          </h1>
          <p className="text-muted-foreground">{jobApplication.companyName}</p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      <JobDetail
        jobApplication={{
          id: jobApplication.id,
          userId: jobApplication.userId,
          jobTitle: jobApplication.jobTitle,
          companyName: jobApplication.companyName,
          jobDescription: jobApplication.jobDescription,
          tailoredResume: jobApplication.tailoredResume,
          coverLetter: jobApplication.coverLetter,
          status: jobApplication.status as JobApplicationStatus,
          createdAt: jobApplication.createdAt.toISOString(),
          updatedAt: jobApplication.updatedAt.toISOString(),
          strengthScore: jobApplication.strengthScore || 0,
          resumeInsight: jobApplication.resumeInsight,
        }}
      />
    </div>
  );
}
