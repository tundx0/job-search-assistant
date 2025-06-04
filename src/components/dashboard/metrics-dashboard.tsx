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

// Colors for charts
const COLORS = ['#10b981', '#22c55e', '#eab308', '#f97316', '#ef4444', '#8b5cf6', '#3b82f6'];
const STATUS_COLORS = {
  submitted: '#10b981',
  pending: '#eab308',
  rejected: '#ef4444',
  interview: '#3b82f6',
  offer: '#8b5cf6',
};

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
    <div className="space-y-4 sm:space-y-6">
      <Card className="shadow-md">
        <CardHeader className="pb-1 sm:pb-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
            <CardTitle className="text-lg sm:text-xl font-bold">Application Metrics</CardTitle>
            <div className="flex space-x-1 sm:space-x-2 self-end sm:self-auto">
              <Button 
                variant={timeRange === 'week' ? 'default' : 'outline'} 
                size="sm"
                className="text-xs h-7 px-2 sm:h-8 sm:px-3 sm:text-sm"
                onClick={() => setTimeRange('week')}
              >
                Week
              </Button>
              <Button 
                variant={timeRange === 'month' ? 'default' : 'outline'} 
                size="sm"
                className="text-xs h-7 px-2 sm:h-8 sm:px-3 sm:text-sm"
                onClick={() => setTimeRange('month')}
              >
                Month
              </Button>
              <Button 
                variant={timeRange === 'year' ? 'default' : 'outline'} 
                size="sm"
                className="text-xs h-7 px-2 sm:h-8 sm:px-3 sm:text-sm"
                onClick={() => setTimeRange('year')}
              >
                Year
              </Button>
            </div>
          </div>
          <CardDescription className="text-xs sm:text-sm">
            Track your job application progress and resume performance
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-3 sm:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg shadow-sm border">
              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Total Applications</div>
              <div className="text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1">{totalApplications}</div>
              <div className="flex items-center mt-1 sm:mt-2">
                <CalendarDays className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 mr-1" />
                <span className="text-[10px] sm:text-xs text-gray-500">All time</span>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg shadow-sm border">
              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Submitted</div>
              <div className="text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1">{submittedApplications}</div>
              <div className="flex items-center mt-1 sm:mt-2">
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-1" />
                <span className="text-[10px] sm:text-xs text-green-500">{Math.round((submittedApplications / totalApplications) * 100)}% of total</span>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg shadow-sm border">
              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Pending</div>
              <div className="text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1">{pendingApplications}</div>
              <div className="flex items-center mt-1 sm:mt-2">
                <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 mr-1" />
                <span className="text-[10px] sm:text-xs text-yellow-500">{Math.round((pendingApplications / totalApplications) * 100)}% of total</span>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg shadow-sm border">
              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Average Match Score</div>
              <div className="text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1">{averageScore}%</div>
              <div className="flex items-center mt-1 sm:mt-2">
                <PieChartIcon className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 mr-1" />
                <span className="text-[10px] sm:text-xs text-blue-500">Highest: {highestScore}%</span>
              </div>
            </div>
          </div>
          
          <Tabs defaultValue="scores" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-9 sm:h-10">
              <TabsTrigger value="scores" className="text-xs sm:text-sm">Resume Scores</TabsTrigger>
              <TabsTrigger value="applications" className="text-xs sm:text-sm">Applications</TabsTrigger>
              <TabsTrigger value="insights" className="text-xs sm:text-sm">Insights</TabsTrigger>
            </TabsList>
            
            <TabsContent value="scores" className="pt-2 sm:pt-4">
              <div className="h-60 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={filteredScoreData}
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10 }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      tick={{ fontSize: 10 }}
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
                      contentStyle={{ fontSize: '11px' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[10px] sm:text-xs text-center text-gray-500 mt-1 sm:mt-2">
                Resume scores over time - higher is better
              </div>
            </TabsContent>
            
            <TabsContent value="applications" className="pt-2 sm:pt-4">
              <div className="h-60 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={filteredApplicationsByMonth}
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip
                      formatter={(value) => [value, 'Applications']}
                      contentStyle={{ fontSize: '11px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[10px] sm:text-xs text-center text-gray-500 mt-1 sm:mt-2">
                Applications submitted by month
              </div>
            </TabsContent>
            
            <TabsContent value="insights" className="pt-2 sm:pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <h4 className="text-xs sm:text-sm font-medium mb-1 sm:mb-2">Application Status</h4>
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
                        <Tooltip formatter={(value, _unused, props) => [`${value} applications`, props.payload.status]} contentStyle={{ fontSize: '11px' }} />
                        <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-xs sm:text-sm font-medium mb-1 sm:mb-2">Top Skill Gaps</h4>
                  <div className="h-48 sm:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={topSkillGaps}
                        layout="vertical"
                        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tick={{ fontSize: 10 }} />
                        <YAxis 
                          dataKey="skill" 
                          type="category" 
                          width={80}
                          tick={{ fontSize: 10 }}
                        />
                        <Tooltip formatter={(value) => [`${value} occurrences`, 'Frequency']} contentStyle={{ fontSize: '11px' }} />
                        <Bar dataKey="count" fill="#ef4444" />
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
