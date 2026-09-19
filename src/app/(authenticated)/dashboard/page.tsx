import Link from "next/link";
import { Suspense } from "react";
import { formatDistanceToNow } from "date-fns";
import { Plus, Loader2, ArrowRight } from "lucide-react";

import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MetricsDashboard } from "@/components/dashboard/metrics-dashboard";
import { generateDashboardMetrics } from "@/lib/metrics/dashboard-metrics";
import { StatusChip } from "@/components/jobs/status-chip";
import { ScoreMeter } from "@/components/jobs/score-meter";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    return null; // The layout redirects, but guard anyway.
  }

  const applications = await prisma.jobApplication.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { resumeInsight: true },
  });

  const metrics = generateDashboardMetrics(applications);
  const recent = applications.slice(0, 8);

  return (
    <div className="min-w-0 space-y-10">
      <header className="page-head">
        <div>
          <p className="label-mono">Overview</p>
          <h1 className="page-title mt-2">Dashboard</h1>
        </div>
        <Link href="/jobs/new">
          <Button>
            <Plus aria-hidden="true" />
            New application
          </Button>
        </Link>
      </header>

      <Suspense
        fallback={
          <Card>
            <CardContent className="flex items-center justify-center gap-3 p-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="label-mono">Loading metrics</span>
            </CardContent>
          </Card>
        }
      >
        <MetricsDashboard
          scoreData={metrics.scoreData}
          applicationsByMonth={metrics.applicationsByMonth}
          applicationsByStatus={metrics.applicationsByStatus}
          topSkillGaps={metrics.topSkillGaps}
          averageScore={metrics.averageScore}
          totalApplications={metrics.totalApplications}
          submittedApplications={metrics.submittedApplications}
          pendingApplications={metrics.pendingApplications}
          highestScore={metrics.highestScore}
        />
      </Suspense>

      <section className="min-w-0 space-y-5">
        <div className="section-marker">
          <span className="label-mono">Recent applications</span>
        </div>

        {applications.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-6 py-14 text-center">
            <p className="font-heading text-lg">No applications yet</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              Paste a job description and Job Search Assistant will draft a
              tailored resume and cover letter from your profile.
            </p>
            <Link href="/jobs/new" className="mt-6 inline-block">
              <Button>
                <Plus aria-hidden="true" />
                Create your first application
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-border">
              <table className="w-full table-auto text-sm">
                <thead>
                  <tr className="border-b border-[var(--rule)]">
                    <th className="label-mono px-4 py-3 text-left font-normal">Role</th>
                    <th className="label-mono hidden px-4 py-3 text-left font-normal sm:table-cell">
                      Company
                    </th>
                    <th className="label-mono px-4 py-3 text-left font-normal">Status</th>
                    <th className="label-mono hidden px-4 py-3 text-left font-normal md:table-cell">
                      Match
                    </th>
                    <th className="label-mono hidden px-4 py-3 text-left font-normal lg:table-cell">
                      Created
                    </th>
                    <th className="label-mono px-4 py-3 text-right font-normal">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((application) => (
                    <tr
                      key={application.id}
                      className="border-b border-[var(--rule-soft)] transition-colors last:border-0 hover:bg-accent/40"
                    >
                      <td className="px-4 py-4 font-medium">
                        <Link
                          href={`/jobs/${application.id}`}
                          className="transition-colors hover:text-primary"
                        >
                          {application.jobTitle}
                        </Link>
                        {/* Folded in on small screens, where their own
                            columns are hidden. */}
                        <span className="mt-1 block text-xs text-muted-foreground sm:hidden">
                          {application.companyName}
                        </span>
                      </td>
                      <td className="hidden px-4 py-4 text-muted-foreground sm:table-cell">
                        {application.companyName}
                      </td>
                      <td className="px-4 py-4">
                        <StatusChip status={application.status} />
                        <span className="mt-1.5 block md:hidden">
                          <ScoreMeter score={application.strengthScore} />
                        </span>
                      </td>
                      <td className="hidden px-4 py-4 md:table-cell">
                        <ScoreMeter score={application.strengthScore} />
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-4 text-muted-foreground lg:table-cell">
                        {formatDistanceToNow(new Date(application.createdAt), {
                          addSuffix: true,
                        })}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Link href={`/jobs/${application.id}`} aria-label={`View ${application.jobTitle}`}>
                          <Button variant="ghost" size="icon" className="sm:hidden">
                            <ArrowRight aria-hidden="true" />
                          </Button>
                          <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                            View
                            <ArrowRight aria-hidden="true" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {applications.length > recent.length && (
              <p className="label-mono">
                Showing {recent.length} of {applications.length}
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
