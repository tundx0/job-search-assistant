'use client';

import { useState } from 'react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  CalendarDays, 
  TrendingUp, 
  BarChart3, 
  PieChart as PieChartIcon
} from 'lucide-react';

// Types for our metrics data
interface MetricsDashboardProps {
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

// Chart colors come from the theme so they track light and dark mode.
const COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];
const STATUS_COLORS = {
  submitted: 'var(--chart-3)',
  pending: 'var(--chart-2)',
  rejected: 'var(--destructive)',
  interviewing: 'var(--chart-5)',
  interview: 'var(--chart-5)',
  accepted: 'var(--success)',
  offer: 'var(--success)',
};

const AXIS = { fontSize: 10, fill: 'var(--muted-foreground)' } as const;
const GRID = 'var(--rule)';
const TOOLTIP_STYLE = {
  fontSize: '11px',
  background: 'var(--popover)',
  border: '1px solid var(--border)',
  borderRadius: '0.5rem',
  color: 'var(--popover-foreground)',
} as const;

/** Percentage of a total, guarding the empty-account case. */
function shareOfTotal(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

export function MetricsDashboard({
  scoreData,
  applicationsByMonth,
  applicationsByStatus,
  topSkillGaps,
  averageScore,
  totalApplications,
  submittedApplications,
  pendingApplications,
  highestScore,
}: MetricsDashboardProps) {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  
  // Filter data based on time range
  const filteredScoreData = scoreData.slice(-getTimeRangeLimit(timeRange));
  const filteredApplicationsByMonth = applicationsByMonth.slice(-getTimeRangeLimit(timeRange, true));

  function getTimeRangeLimit(range: 'week' | 'month' | 'year', isMonth = false): number {
    if (isMonth) {
      return range === 'week' ? 4 : range === 'month' ? 6 : 12;
    }
    return range === 'week' ? 7 : range === 'month' ? 30 : 365;
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <CardTitle>Application metrics</CardTitle>
              <CardDescription className="mt-1.5">
                Your application progress and how your drafts are scoring
              </CardDescription>
            </div>
            <div className="flex gap-1.5 self-end sm:self-auto">
              <Button 
                variant={timeRange === 'week' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setTimeRange('week')}
              >
                Week
              </Button>
              <Button 
                variant={timeRange === 'month' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setTimeRange('month')}
              >
                Month
              </Button>
              <Button 
                variant={timeRange === 'year' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setTimeRange('year')}
              >
                Year
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <dl className="mb-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-[var(--rule)] md:grid-cols-4">
            <div className="bg-card p-4 sm:p-5">
              <dt className="label-mono">Total applications</dt>
              <dd className="stat-value mt-2">{totalApplications}</dd>
              <p className="mt-2 flex items-center gap-1.5 text-[0.6875rem] text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                All time
              </p>
            </div>

            <div className="bg-card p-4 sm:p-5">
              <dt className="label-mono">Submitted</dt>
              <dd className="stat-value mt-2">{submittedApplications}</dd>
              <p className="mt-2 flex items-center gap-1.5 text-[0.6875rem] text-success">
                <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                {shareOfTotal(submittedApplications, totalApplications)}% of total
              </p>
            </div>

            <div className="bg-card p-4 sm:p-5">
              <dt className="label-mono">Pending</dt>
              <dd className="stat-value mt-2">{pendingApplications}</dd>
              <p className="mt-2 flex items-center gap-1.5 text-[0.6875rem] text-warning">
                <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
                {shareOfTotal(pendingApplications, totalApplications)}% of total
              </p>
            </div>

            <div className="bg-card p-4 sm:p-5">
              <dt className="label-mono">Average match</dt>
              <dd className="stat-value mt-2">{averageScore}%</dd>
              <p className="mt-2 flex items-center gap-1.5 text-[0.6875rem] text-info">
                <PieChartIcon className="h-3.5 w-3.5" aria-hidden="true" />
                Highest: {highestScore}%
              </p>
            </div>
          </dl>

          <Tabs defaultValue="scores" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="scores">Resume scores</TabsTrigger>
              <TabsTrigger value="applications">Applications</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>
            
            <TabsContent value="scores" className="pt-6">
              <div className="h-60 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={filteredScoreData}
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                    <XAxis 
                      dataKey="date" 
                      tick={AXIS}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      tick={AXIS}
                    />
                    <Tooltip
                      labelFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.toLocaleDateString()}`;
                      }}
                      formatter={(value, _name, props) => [
                        `${value}%`, 
                        `${props.payload.jobTitle}`
                      ]}
                      contentStyle={TOOLTIP_STYLE}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="var(--chart-1)" 
                      strokeWidth={2}
                      dot={{ r: 3, fill: 'var(--chart-1)' }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="label-mono mt-3 text-center">
                Resume scores over time &mdash; higher is better
              </p>
            </TabsContent>
            
            <TabsContent value="applications" className="pt-6">
              <div className="h-60 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={filteredApplicationsByMonth}
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                    <XAxis dataKey="month" tick={AXIS} />
                    <YAxis tick={AXIS} />
                    <Tooltip
                      formatter={(value) => [value, 'Applications']}
                      contentStyle={TOOLTIP_STYLE}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="var(--chart-3)"
                      fill="var(--chart-3)"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="label-mono mt-3 text-center">
                Applications by month
              </p>
            </TabsContent>
            
            <TabsContent value="insights" className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <h4 className="label-mono mb-3">Application status</h4>
                  <div className="h-48 sm:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={applicationsByStatus}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          paddingAngle={5}
                          dataKey="count"
                          label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {applicationsByStatus.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS] || COLORS[index % COLORS.length]} 
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, _unused, props) => [`${value} applications`, props.payload.status]} contentStyle={TOOLTIP_STYLE} />
                        <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div>
                  <h4 className="label-mono mb-3">Top skill gaps</h4>
                  <div className="h-48 sm:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={topSkillGaps}
                        layout="vertical"
                        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                        <XAxis type="number" tick={AXIS} />
                        <YAxis 
                          dataKey="skill" 
                          type="category" 
                          width={80}
                          tick={AXIS}
                        />
                        <Tooltip formatter={(value) => [`${value} occurrences`, 'Frequency']} contentStyle={TOOLTIP_STYLE} />
                        <Bar dataKey="count" fill="var(--chart-2)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
