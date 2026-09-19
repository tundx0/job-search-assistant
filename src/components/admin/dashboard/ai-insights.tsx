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
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

interface AIInsightsProps {
  metrics: AdminMetrics;
}

export function AIInsights({ metrics }: AIInsightsProps) {
  return (
    <>
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Resume Strength Distribution</CardTitle>
          <CardDescription>
            Distribution of resume strength scores across all applications
          </CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={metrics.strengthScoreDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="var(--chart-1)"
                dataKey="count"
                nameKey="range"
                label={({ range, percent }) => 
                  `${range}: ${(percent * 100).toFixed(0)}%`
                }
              >
                {metrics.strengthScoreDistribution.map((entry, index) => (
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
          <CardTitle>Common Skill Gaps</CardTitle>
          <CardDescription>
            Most common skill gaps identified in resumes
          </CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={metrics.mostCommonSkillGaps}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis 
                dataKey="skill" 
                type="category" 
                width={100}
                tick={{ fontSize: 12 }}
              />
              <Tooltip />
              <Legend />
              <Bar 
                dataKey="count" 
                fill="var(--chart-1)" 
                name="Frequency"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Skill Analysis</CardTitle>
          <CardDescription>
            Most common skills identified in resumes
          </CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={metrics.mostCommonSkillGaps.slice(0, 10)}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis
                type="category"
                dataKey="skill"
                width={100}
                tick={{ fontSize: 12 }}
              />
              <Tooltip />
              <Bar
                dataKey="count"
                fill="var(--chart-1)"
                name="Occurrences"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>AI Insight Metrics</CardTitle>
          <CardDescription>
            Key statistics about AI-generated insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  Average Score
                </p>
                <p className="text-sm text-muted-foreground">
                  Average resume strength score
                </p>
              </div>
              <div className="font-medium">
                {metrics.averageStrengthScore}%
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  High Scoring Resumes
                </p>
                <p className="text-sm text-muted-foreground">
                  Resumes with scores 80+
                </p>
              </div>
              <div className="font-medium">
                {metrics.strengthScoreDistribution.find(
                  (d) => d.range === "81-100"
                )?.count || 0}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  Low Scoring Resumes
                </p>
                <p className="text-sm text-muted-foreground">
                  Resumes with scores below 40
                </p>
              </div>
              <div className="font-medium">
                {(metrics.strengthScoreDistribution.find(
                  (d) => d.range === "0-20"
                )?.count || 0) +
                  (metrics.strengthScoreDistribution.find(
                    (d) => d.range === "21-40"
                  )?.count || 0)}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  Most Common Skill Gap
                </p>
                <p className="text-sm text-muted-foreground">
                  Top skill gap identified
                </p>
              </div>
              <div className="font-medium">
                {metrics.mostCommonSkillGaps &&
                metrics.mostCommonSkillGaps.length > 0
                  ? metrics.mostCommonSkillGaps[0]?.skill || "None"
                  : "None"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
