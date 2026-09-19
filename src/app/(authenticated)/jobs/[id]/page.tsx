import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/jobs/status-chip";
import { ArrowLeft } from "lucide-react";
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
    <div className="space-y-8">
      <header className="page-head">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <p className="label-mono">{jobApplication.companyName}</p>
            <StatusChip status={jobApplication.status} />
          </div>
          <h1 className="page-title mt-2">{jobApplication.jobTitle}</h1>
        </div>
        <Link href="/dashboard">
          <Button variant="outline">
            <ArrowLeft aria-hidden="true" />
            Back to dashboard
          </Button>
        </Link>
      </header>

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
