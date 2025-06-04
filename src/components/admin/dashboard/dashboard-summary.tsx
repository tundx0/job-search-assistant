"use client";

import { Users, FileText, HardDrive } from "lucide-react";
import { MetricCard } from "./metric-card";
import type { AdminMetrics } from "@/lib/admin/admin-metrics";

interface DashboardSummaryProps {
  metrics: AdminMetrics;
}

export function DashboardSummary({ metrics }: DashboardSummaryProps) {
  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Total Users"
        value={metrics.totalUsers}
        icon={Users}
        subtitle={`+${metrics.newUsersThisMonth} this month`}
      />
      
      <MetricCard
        title="Total Applications"
        value={metrics.totalApplications}
        icon={FileText}
        subtitle={`+${metrics.applicationsThisMonth} this month`}
      />
      
      <MetricCard
        title="Documents Generated"
        value={metrics.totalDocumentsGenerated}
        icon={FileText}
        subtitle={`+${metrics.documentsGeneratedThisMonth} this month`}
      />
      
      <MetricCard
        title="Storage Used"
        value={`${metrics.storageUsed} MB`}
        icon={HardDrive}
        subtitle="Estimated total storage"
      />
    </div>
  );
}
