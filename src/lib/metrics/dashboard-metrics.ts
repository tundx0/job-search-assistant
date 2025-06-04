import { format, subMonths, isAfter } from 'date-fns';
import { JobApplication, ResumeInsight } from '@prisma/client';

export type JobApplicationWithInsights = JobApplication & {
  resumeInsight?: ResumeInsight | null;
};

export interface DashboardMetrics {
  scoreData: {
    date: string;
    score: number;
    jobTitle: string;
  }[];
  applicationsByMonth: {
    month: string;
    count: number;
  }[];
  applicationsByStatus: {
    status: string;
    count: number;
  }[];
  topSkillGaps: {
    skill: string;
    count: number;
  }[];
  averageScore: number;
  totalApplications: number;
  submittedApplications: number;
  pendingApplications: number;
  highestScore: number;
}

/**
 * Generates metrics for the dashboard from job applications data
 */
export function generateDashboardMetrics(
  applications: JobApplicationWithInsights[]
): DashboardMetrics {
  // Filter applications with scores
  const applicationsWithScores = applications.filter(
    (app) => app.strengthScore !== null && app.strengthScore !== undefined
  );

  // Calculate average score
  const totalScore = applicationsWithScores.reduce(
    (sum, app) => sum + (app.strengthScore || 0),
    0
  );
  const averageScore = applicationsWithScores.length
    ? Math.round(totalScore / applicationsWithScores.length)
    : 0;

  // Get highest score
  const highestScore = applicationsWithScores.length
    ? Math.max(...applicationsWithScores.map((app) => app.strengthScore || 0))
    : 0;

  // Count applications by status
  const statusCounts: Record<string, number> = {};
  applications.forEach((app) => {
    const status = app.status || 'unknown';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  const applicationsByStatus = Object.entries(statusCounts).map(
    ([status, count]) => ({
      status,
      count,
    })
  );

  // Count applications by month (last 12 months)
  const monthCounts: Record<string, number> = {};
  const now = new Date();
  
  // Initialize all months with 0
  for (let i = 0; i < 12; i++) {
    const monthDate = subMonths(now, i);
    const monthKey = format(monthDate, 'MMM yyyy');
    monthCounts[monthKey] = 0;
  }
  
  // Count applications by month
  applications.forEach((app) => {
    const createdAt = new Date(app.createdAt);
    // Only count applications from the last 12 months
    if (isAfter(createdAt, subMonths(now, 12))) {
      const monthKey = format(createdAt, 'MMM yyyy');
      monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
    }
  });

  const applicationsByMonth = Object.entries(monthCounts)
    .map(([month, count]) => ({ month, count }))
    .reverse(); // Most recent months first

  // Prepare score data for chart
  const scoreData = applicationsWithScores
    .map((app) => ({
      date: app.createdAt.toISOString(),
      score: app.strengthScore || 0,
      jobTitle: app.jobTitle,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Collect skill gaps from resume insights
  const skillGapMap = new Map<string, number>();
  
  applications.forEach((app) => {
    if (app.resumeInsight?.skillGaps) {
      app.resumeInsight.skillGaps.forEach((skill) => {
        skillGapMap.set(skill, (skillGapMap.get(skill) || 0) + 1);
      });
    }
  });
  
  // Convert to array and sort by frequency
  const topSkillGaps = Array.from(skillGapMap.entries())
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Get top 5 skill gaps

  return {
    scoreData,
    applicationsByMonth,
    applicationsByStatus,
    topSkillGaps,
    averageScore,
    totalApplications: applications.length,
    submittedApplications: applications.filter(app => app.status === 'submitted').length,
    pendingApplications: applications.filter(app => app.status === 'pending').length,
    highestScore,
  };
}
