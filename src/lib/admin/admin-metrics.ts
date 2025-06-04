import { format, subMonths, startOfMonth, endOfMonth, isAfter, subDays } from 'date-fns';
import { prisma } from '@/lib/db/prisma';
import { User, JobApplication, ResumeInsight } from '@prisma/client';

export interface UserWithApplications extends User {
  jobApplications: JobApplication[];
  _count?: {
    jobApplications: number;
  };
}

export interface JobApplicationWithInsights extends JobApplication {
  resumeInsight?: ResumeInsight | null;
  user: User;
}

export interface AdminMetrics {
  // User metrics
  totalUsers: number;
  newUsersThisMonth: number;
  activeUsers: number; // Users with activity in the last 30 days
  usersByMonth: {
    month: string;
    count: number;
  }[];
  
  // Application metrics
  totalApplications: number;
  applicationsThisMonth: number;
  applicationsByMonth: {
    month: string;
    count: number;
  }[];
  applicationsByStatus: {
    status: string;
    count: number;
  }[];
  
  // Document metrics
  totalDocumentsGenerated: number;
  documentsGeneratedThisMonth: number;
  documentsByMonth: {
    month: string;
    count: number;
  }[];
  
  // AI metrics
  averageStrengthScore: number;
  strengthScoreDistribution: {
    range: string;
    count: number;
  }[];
  mostCommonSkillGaps: {
    skill: string;
    count: number;
  }[];
  
  // Top users
  topUsersByApplications: {
    userId: string;
    userName: string;
    applicationCount: number;
  }[];
  
  // System metrics
  storageUsed: number; // in MB
}

/**
 * Fetches all metrics needed for the admin dashboard
 */
export async function fetchAdminMetrics(): Promise<AdminMetrics> {
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);
  const currentMonth = {
    start: startOfMonth(now),
    end: endOfMonth(now),
  };
  
  // Fetch all users with counts
  const users = await prisma.user.findMany({
    include: {
      _count: {
        select: {
          jobApplications: true,
        },
      },
    },
  });
  
  // Fetch all applications with insights
  const applications = await prisma.jobApplication.findMany({
    include: {
      resumeInsight: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
  
  // Calculate user metrics
  const totalUsers = users.length;
  const newUsersThisMonth = users.filter(user => 
    isAfter(new Date(user.createdAt), currentMonth.start)
  ).length;
  const activeUsers = await prisma.user.count({
    where: {
      OR: [
        {
          jobApplications: {
            some: {
              updatedAt: {
                gte: thirtyDaysAgo,
              },
            },
          },
        },
        {
          updatedAt: {
            gte: thirtyDaysAgo,
          },
        },
      ],
    },
  });
  
  // Calculate user registration by month (last 12 months)
  const usersByMonth = calculateCountsByMonth(
    users.map(user => ({ date: user.createdAt, id: user.id }))
  );
  
  // Calculate application metrics
  const totalApplications = applications.length;
  const applicationsThisMonth = applications.filter(app => 
    isAfter(new Date(app.createdAt), currentMonth.start)
  ).length;
  
  // Applications by month
  const applicationsByMonth = calculateCountsByMonth(
    applications.map(app => ({ date: app.createdAt, id: app.id }))
  );
  
  // Applications by status
  const statusCounts: Record<string, number> = {};
  applications.forEach(app => {
    const status = app.status || 'unknown';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });
  
  const applicationsByStatus = Object.entries(statusCounts).map(
    ([status, count]) => ({
      status,
      count,
    })
  );
  
  // Document metrics (assuming each application with a tailoredResume has generated documents)
  const applicationsWithDocuments = applications.filter(
    app => app.tailoredResume && app.tailoredResume.length > 0
  );
  
  const totalDocumentsGenerated = applicationsWithDocuments.length;
  const documentsGeneratedThisMonth = applicationsWithDocuments.filter(app => 
    isAfter(new Date(app.updatedAt), currentMonth.start)
  ).length;
  
  // Documents by month
  const documentsByMonth = calculateCountsByMonth(
    applicationsWithDocuments.map(app => ({ date: app.updatedAt, id: app.id }))
  );
  
  // AI metrics
  const applicationsWithScores = applications.filter(
    app => app.strengthScore !== null && app.strengthScore !== undefined
  );
  
  const totalScore = applicationsWithScores.reduce(
    (sum, app) => sum + (app.strengthScore || 0),
    0
  );
  
  const averageStrengthScore = applicationsWithScores.length
    ? Math.round(totalScore / applicationsWithScores.length)
    : 0;
  
  // Strength score distribution
  const scoreRanges = [
    { min: 0, max: 20, label: '0-20' },
    { min: 21, max: 40, label: '21-40' },
    { min: 41, max: 60, label: '41-60' },
    { min: 61, max: 80, label: '61-80' },
    { min: 81, max: 100, label: '81-100' },
  ];
  
  const strengthScoreDistribution = scoreRanges.map(range => {
    const count = applicationsWithScores.filter(
      app => {
        const score = app.strengthScore || 0;
        return score >= range.min && score <= range.max;
      }
    ).length;
    
    return {
      range: range.label,
      count,
    };
  });
  
  // Most common skill gaps
  const skillGapMap = new Map<string, number>();
  
  applications.forEach(app => {
    if (app.resumeInsight?.skillGaps) {
      app.resumeInsight.skillGaps.forEach(skill => {
        skillGapMap.set(skill, (skillGapMap.get(skill) || 0) + 1);
      });
    }
  });
  
  const mostCommonSkillGaps = Array.from(skillGapMap.entries())
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 skill gaps
  
  // Top users by applications
  const userApplicationCounts = new Map<string, { count: number; name: string }>();
  
  applications.forEach(app => {
    const userId = app.userId;
    const userName = app.user.name;
    const current = userApplicationCounts.get(userId) || { count: 0, name: userName };
    userApplicationCounts.set(userId, { count: current.count + 1, name: userName });
  });
  
  const topUsersByApplications = Array.from(userApplicationCounts.entries())
    .map(([userId, data]) => ({
      userId,
      userName: data.name,
      applicationCount: data.count,
    }))
    .sort((a, b) => b.applicationCount - a.applicationCount)
    .slice(0, 10); // Top 10 users
  
  // Estimate storage used (rough calculation based on number of documents)
  // Assuming average PDF size of 500KB and JSON size of 50KB
  const estimatedStoragePerDocument = 0.55; // MB
  const storageUsed = Math.round(totalDocumentsGenerated * estimatedStoragePerDocument);
  
  return {
    // User metrics
    totalUsers,
    newUsersThisMonth,
    activeUsers,
    usersByMonth,
    
    // Application metrics
    totalApplications,
    applicationsThisMonth,
    applicationsByMonth,
    applicationsByStatus,
    
    // Document metrics
    totalDocumentsGenerated,
    documentsGeneratedThisMonth,
    documentsByMonth,
    
    // AI metrics
    averageStrengthScore,
    strengthScoreDistribution,
    mostCommonSkillGaps,
    
    // Top users
    topUsersByApplications,
    
    // System metrics
    storageUsed,
  };
}

/**
 * Helper function to calculate counts by month
 */
function calculateCountsByMonth(items: { date: Date; id: string }[]): { month: string; count: number }[] {
  const monthCounts: Record<string, number> = {};
  const now = new Date();
  
  // Initialize all months with 0 for the last 12 months
  for (let i = 0; i < 12; i++) {
    const monthDate = subMonths(now, i);
    const monthKey = format(monthDate, 'MMM yyyy');
    monthCounts[monthKey] = 0;
  }
  
  // Count items by month
  items.forEach(item => {
    const date = new Date(item.date);
    // Only count items from the last 12 months
    if (isAfter(date, subMonths(now, 12))) {
      const monthKey = format(date, 'MMM yyyy');
      monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
    }
  });
  
  return Object.entries(monthCounts)
    .map(([month, count]) => ({ month, count }))
    .reverse(); // Most recent months first
}
