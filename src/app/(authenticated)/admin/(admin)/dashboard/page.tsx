import { fetchAdminMetrics } from "@/lib/admin/admin-metrics";
import type { AdminMetrics } from "@/lib/admin/admin-metrics";
import { DashboardSummary } from "@/components/admin/dashboard/dashboard-summary";
import { DashboardTabs } from "@/components/admin/dashboard/dashboard-tabs";

export default async function AdminDashboardPage() {
  let metrics: AdminMetrics | null = null;
  let error: string | null = null;

  try {
    metrics = await fetchAdminMetrics();
  } catch (err) {
    console.error("Failed to fetch admin metrics:", err);
    error = "Failed to load dashboard metrics. Please try again later.";
  }

  if (error) {
    return (
      <div className="space-y-4 sm:space-y-8 px-2 sm:px-0">
        <div>
          <h1 className="page-title">Admin dashboard</h1>
          <p className="text-sm sm:text-base text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="space-y-4 sm:space-y-8 px-2 sm:px-0">
        <div>
          <h1 className="page-title">Admin dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">No metrics data available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-8 px-2 sm:px-0">
      <div>
        <h1 className="page-title">Admin dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Overview of all system metrics and user activities
        </p>
      </div>

      {/* Summary Cards */}
      <DashboardSummary metrics={metrics} />

      {/* Tabs for different metrics */}
      <DashboardTabs metrics={metrics} />
    </div>
  );
}
