"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCharts } from "./user-charts";
import { ApplicationCharts } from "./application-charts";
import { DocumentCharts } from "./document-charts";
import { AIInsights } from "./ai-insights";
import { TopUsers } from "./top-users";
import type { AdminMetrics } from "@/lib/admin/admin-metrics";

interface DashboardTabsProps {
  metrics: AdminMetrics;
}

export function DashboardTabs({ metrics }: DashboardTabsProps) {
  return (
    <Tabs defaultValue="users" className="space-y-4">
      <div className="overflow-x-auto pb-2">
        <TabsList className="w-full sm:w-auto flex flex-nowrap">
          <TabsTrigger value="users" className="text-xs sm:text-sm whitespace-nowrap">Users</TabsTrigger>
          <TabsTrigger value="applications" className="text-xs sm:text-sm whitespace-nowrap">Applications</TabsTrigger>
          <TabsTrigger value="documents" className="text-xs sm:text-sm whitespace-nowrap">Documents</TabsTrigger>
          <TabsTrigger value="ai" className="text-xs sm:text-sm whitespace-nowrap">AI Insights</TabsTrigger>
        </TabsList>
      </div>
      
      <TabsContent value="users" className="space-y-4">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <UserCharts metrics={metrics} />
          <TopUsers metrics={metrics} />
        </div>
      </TabsContent>
      
      <TabsContent value="applications" className="space-y-4">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <ApplicationCharts metrics={metrics} />
        </div>
      </TabsContent>
      
      <TabsContent value="documents" className="space-y-4">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <DocumentCharts metrics={metrics} />
        </div>
      </TabsContent>
      
      <TabsContent value="ai" className="space-y-4">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <AIInsights metrics={metrics} />
        </div>
      </TabsContent>
    </Tabs>
  );
}
