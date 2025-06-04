"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { AdminMetrics } from "@/lib/admin/admin-metrics";

// Colors for charts
const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];

interface ApplicationChartsProps {
  metrics: AdminMetrics;
}

export function ApplicationCharts({ metrics }: ApplicationChartsProps) {
  return (
    <>
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Applications by Month</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={metrics.applicationsByMonth}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="count"
                fill="#8884d8"
                name="Applications"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Applications by Status</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={metrics.applicationsByStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
                nameKey="status"
                label={({ status, percent }) => 
                  `${status}: ${(percent * 100).toFixed(0)}%`
                }
              >
                {metrics.applicationsByStatus.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Application Metrics</CardTitle>
          <CardDescription>
            Key statistics about job applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  Average per User
                </p>
                <p className="text-sm text-muted-foreground">
                  Applications per user
                </p>
              </div>
              <div className="font-medium">
                {(
                  metrics.totalApplications / (metrics.totalUsers || 1)
                ).toFixed(1)}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  Document Rate
                </p>
                <p className="text-sm text-muted-foreground">
                  % of applications with documents
                </p>
              </div>
              <div className="font-medium">
                {Math.round(
                  (metrics.totalDocumentsGenerated /
                    (metrics.totalApplications || 1)) *
                    100
                )}
                %
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  Applications This Month
                </p>
                <p className="text-sm text-muted-foreground">
                  % of total applications
                </p>
              </div>
              <div className="font-medium">
                {Math.round(
                  (metrics.applicationsThisMonth /
                    (metrics.totalApplications || 1)) *
                    100
                )}
                %
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
