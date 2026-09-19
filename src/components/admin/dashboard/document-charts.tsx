"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { AdminMetrics } from "@/lib/admin/admin-metrics";

interface DocumentChartsProps {
  metrics: AdminMetrics;
}

export function DocumentCharts({ metrics }: DocumentChartsProps) {
  return (
    <>
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Documents Generated</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={metrics.documentsByMonth}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="count"
                stroke="var(--chart-4)"
                fill="var(--chart-4)"
                name="Documents"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Storage Metrics</CardTitle>
          <CardDescription>Document storage statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  Total Storage Used
                </p>
                <p className="text-sm text-muted-foreground">
                  Estimated total storage
                </p>
              </div>
              <div className="font-medium">
                {metrics.storageUsed} MB
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  Average Document Size
                </p>
                <p className="text-sm text-muted-foreground">
                  Average size per document
                </p>
              </div>
              <div className="font-medium">
                {metrics.totalDocumentsGenerated > 0
                  ? (metrics.storageUsed / metrics.totalDocumentsGenerated).toFixed(2)
                  : 0}{" "}
                MB
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  Documents per User
                </p>
                <p className="text-sm text-muted-foreground">
                  Average documents per user
                </p>
              </div>
              <div className="font-medium">
                {(
                  metrics.totalDocumentsGenerated /
                  (metrics.totalUsers || 1)
                ).toFixed(1)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
