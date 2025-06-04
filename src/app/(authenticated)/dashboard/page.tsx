import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { MetricsDashboard } from "@/components/dashboard/metrics-dashboard";
import { generateDashboardMetrics } from "@/lib/metrics/dashboard-metrics";
import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Get color based on score
function getScoreColor(score: number) {
  if (score >= 80) return "#10b981"; // Green
  if (score >= 60) return "#22c55e"; // Light green
  if (score >= 40) return "#eab308"; // Yellow
  if (score >= 20) return "#f97316"; // Orange
  return "#ef4444"; // Red
}

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    return null; // This should be handled by the layout, but just in case
  }

  // Fetch applications with resume insights for metrics
  const applications = await prisma.jobApplication.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      resumeInsight: true, // Include resume insights for metrics
    },
  });

  // Generate metrics for the dashboard
  const metrics = generateDashboardMetrics(applications);

  const applicationCount = applications.length;
  const pendingCount = applications.filter(
    (app) => app.status === "pending"
  ).length;
  const submittedCount = applications.filter(
    (app) => app.status === "submitted"
  ).length;

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-center sm:text-left">
          Dashboard
        </h1>
        <Link href="/jobs/new" className="self-center sm:self-auto">
          <Button size="sm" className="w-full sm:w-auto sm:text-base sm:h-10 sm:px-4">New Application</Button>
        </Link>
      </div>
      
      {/* Metrics Dashboard */}
      <Suspense fallback={
        <Card>
          <CardContent className="flex items-center justify-center p-10">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading metrics...</span>
          </CardContent>
        </Card>
      }>
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

      {/* Summary Stats (Simplified) */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4 sm:p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <h3 className="tracking-tight text-xs sm:text-sm font-medium">
              Total Applications
            </h3>
          </div>
          <div className="text-xl sm:text-2xl font-bold">{applicationCount}</div>
        </div>
        <div className="rounded-lg border bg-card p-4 sm:p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <h3 className="tracking-tight text-xs sm:text-sm font-medium">Pending</h3>
          </div>
          <div className="text-xl sm:text-2xl font-bold">{pendingCount}</div>
        </div>
        <div className="rounded-lg border bg-card p-4 sm:p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <h3 className="tracking-tight text-xs sm:text-sm font-medium">Submitted</h3>
          </div>
          <div className="text-xl sm:text-2xl font-bold">{submittedCount}</div>
        </div>
      </div>

      <div>
        <h2 className="text-lg sm:text-xl font-bold tracking-tight mb-3 sm:mb-4">
          Recent Applications
        </h2>
        {applications.length === 0 ? (
          <div className="rounded-lg border bg-card p-4 sm:p-6 text-center">
            <p className="text-sm text-muted-foreground">No job applications yet.</p>
            <Link href="/jobs/new" className="mt-3 sm:mt-4 inline-block">
              <Button size="sm" className="sm:text-base sm:h-10">Create your first application</Button>
            </Link>
          </div>
        ) : (
          <div className="rounded-lg border">
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="py-2 px-3 sm:py-3 sm:px-6 text-left font-medium">
                      Job Title
                    </th>
                    <th className="py-2 px-3 sm:py-3 sm:px-6 text-left font-medium hidden sm:table-cell">Company</th>
                    <th className="py-2 px-3 sm:py-3 sm:px-6 text-left font-medium">
                      Status
                    </th>
                    <th className="py-2 px-3 sm:py-3 sm:px-6 text-left font-medium hidden md:table-cell">
                      Match Score
                    </th>
                    <th className="py-2 px-3 sm:py-3 sm:px-6 text-left font-medium hidden sm:table-cell">Created</th>
                    <th className="py-2 px-3 sm:py-3 sm:px-6 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((application) => (
                    <tr
                      key={application.id}
                      className="border-b hover:bg-muted/50"
                    >
                      <td className="py-2 px-3 sm:py-3 sm:px-6 truncate max-w-[120px] sm:max-w-none">{application.jobTitle}</td>
                      <td className="py-2 px-3 sm:py-3 sm:px-6 hidden sm:table-cell">{application.companyName}</td>
                      <td className="py-2 px-3 sm:py-3 sm:px-6">
                        <span
                          className={`inline-flex items-center rounded-full px-1.5 sm:px-2.5 py-0.5 text-[10px] sm:text-xs font-medium ${
                            application.status === "submitted"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {application.status.charAt(0).toUpperCase() +
                            application.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-2 px-3 sm:py-3 sm:px-6 hidden md:table-cell">
                        {application.strengthScore !== undefined ? (
                          <div className="flex items-center">
                            <div
                              className="w-10 h-5 sm:w-12 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-semibold text-white"
                              style={{
                                backgroundColor: getScoreColor(
                                  application.strengthScore || 0
                                ),
                                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                              }}
                            >
                              {application.strengthScore}%
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-[10px] sm:text-xs">
                            Not scored
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 sm:py-3 sm:px-6 hidden sm:table-cell">
                        {formatDistanceToNow(new Date(application.createdAt), {
                          addSuffix: true,
                        })}
                      </td>
                      <td className="py-2 px-3 sm:py-3 sm:px-6 text-right">
                        <Link href={`/jobs/${application.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm">
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
