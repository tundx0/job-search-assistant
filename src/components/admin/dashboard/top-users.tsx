"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { AdminMetrics } from "@/lib/admin/admin-metrics";

interface TopUsersProps {
  metrics: AdminMetrics;
}

export function TopUsers({ metrics }: TopUsersProps) {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Top Users by Applications</CardTitle>
        <CardDescription>
          Users with the most job applications
        </CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={metrics.topUsersByApplications}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis 
              dataKey="userName" 
              type="category" 
              width={100}
              tick={{ fontSize: 12 }}
            />
            <Tooltip />
            <Legend />
            <Bar 
              dataKey="applicationCount" 
              fill="var(--chart-1)" 
              name="Applications"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
