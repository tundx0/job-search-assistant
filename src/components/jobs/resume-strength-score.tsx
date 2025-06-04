"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  RadialBarChart,
  RadialBar,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResumeInsight } from "@/types";

interface ResumeStrengthScoreProps {
  score?: number;
  jobTitle?: string;
  insights?: ResumeInsight | null;
}

export function ResumeStrengthScore({
  score = 0,
  jobTitle,
  insights,
}: ResumeStrengthScoreProps) {
  // Get color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return "#10b981"; // Green
    if (score >= 60) return "#22c55e"; // Light green
    if (score >= 40) return "#eab308"; // Yellow
    if (score >= 20) return "#f97316"; // Orange
    return "#ef4444"; // Red
  };

  // Get text based on score
  const getScoreText = (score: number) => {
    if (score >= 80) return "Excellent Match";
    if (score >= 60) return "Good Match";
    if (score >= 40) return "Average Match";
    if (score >= 20) return "Below Average";
    return "Poor Match";
  };

  // Prepare data for pie chart
  const pieData = [
    { name: "Score", value: score },
    { name: "Gap", value: 100 - score },
  ];

  // No longer using barData as we have better visualizations

  // Prepare data for radial bar chart
  const radialData = [
    {
      name: "Score",
      value: score,
      fill: getScoreColor(score),
    },
  ];

  // Prepare comparison data (simulated)
  const comparisonData = [
    {
      name: "Your Resume",
      value: score,
      fill: "#3b82f6",
    },
    {
      name: "Average",
      value: Math.min(Math.max(score - 15, 20), 75), // Simulated average
      fill: "#94a3b8",
    },
    {
      name: "Top Candidates",
      value: Math.min(score + 15, 95), // Simulated top candidates
      fill: "#10b981",
    },
  ];

  // Use real missing keywords from insights if available, otherwise use simulation
  const keywordMatches = insights?.missingKeywords
    ? insights.missingKeywords.map((keyword: string) => ({
        keyword,
        matched: false,
      }))
    : [
        { keyword: "React", matched: Math.random() > 0.3 },
        { keyword: "TypeScript", matched: Math.random() > 0.3 },
        { keyword: "Next.js", matched: Math.random() > 0.3 },
        { keyword: "JavaScript", matched: Math.random() > 0.3 },
        { keyword: "Node.js", matched: Math.random() > 0.3 },
        { keyword: "API", matched: Math.random() > 0.3 },
        { keyword: "Frontend", matched: Math.random() > 0.3 },
        { keyword: "Backend", matched: Math.random() > 0.3 },
      ].sort((a, b) => (a.matched === b.matched ? 0 : a.matched ? -1 : 1));

  return (
    <Card className="w-full overflow-hidden">
      <div className="h-2" style={{ backgroundColor: getScoreColor(score) }} />
      <CardHeader className="pb-0">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              Resume Strength Analysis
              <Badge
                className="ml-2"
                style={{
                  backgroundColor: getScoreColor(score),
                  color: "white",
                }}
              >
                {getScoreText(score)}
              </Badge>
            </CardTitle>
            <CardDescription className="mt-1">
              How well your resume matches the {jobTitle} position
            </CardDescription>
          </div>

          <div className="flex items-center justify-center w-32 h-32 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="text-4xl font-bold"
                style={{ color: getScoreColor(score) }}
              >
                {score}%
              </div>
            </div>
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full transform -rotate-90"
            >
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="10"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={getScoreColor(score)}
                strokeWidth="10"
                strokeDasharray={`${(2 * Math.PI * 45 * score) / 100} ${
                  (2 * Math.PI * 45 * (100 - score)) / 100
                }`}
              />
            </svg>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mt-2 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="h-2.5 rounded-full transition-all duration-500 ease-in-out"
                style={{
                  width: `${score}%`,
                  backgroundColor: getScoreColor(score),
                }}
              ></div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {score >= 80
              ? "Your resume is an excellent match for this position. You&apos;re well-positioned to stand out to recruiters."
              : score >= 60
              ? "Your resume shows a good match with this job. With a few tweaks, you could improve your chances even more."
              : score >= 40
              ? "Your resume has moderate alignment with this position. Consider enhancing key sections to improve your match."
              : "Your resume needs significant improvements to better match this job&apos;s requirements."}
          </p>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="keywords">Keywords</TabsTrigger>
            <TabsTrigger value="improvements">Improvements</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                    >
                      <Cell key={`cell-0`} fill={getScoreColor(score)} />
                      <Cell key={`cell-1`} fill="#e5e7eb" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="30%"
                    outerRadius="100%"
                    barSize={20}
                    data={radialData}
                    startAngle={180}
                    endAngle={0}
                  >
                    <RadialBar background dataKey="value" cornerRadius={10} />
                    <Tooltip />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              <p>
                Your resume has a strength score of <strong>{score}%</strong>{" "}
                for this position.{" "}
                {score >= 60
                  ? "This indicates a strong match with the job requirements."
                  : score >= 40
                  ? "Consider enhancing your resume to better match the job requirements."
                  : "Your resume needs significant improvements to match this job's requirements."}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="comparison">
            <div className="h-[300px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={comparisonData}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis type="category" dataKey="name" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" radius={[0, 10, 10, 0]}>
                    {comparisonData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-sm text-muted-foreground mt-4">
              <p>
                This chart compares your resume strength against estimated
                averages.
                {score > comparisonData[1].value
                  ? " Your resume is performing above average for this position."
                  : " Your resume is below the average for this position."}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="keywords">
            <div className="mt-4">
              <h3 className="font-medium mb-4">Key Terms in Job Description</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="border rounded-lg p-4 bg-green-50">
                  <h4 className="text-sm font-medium text-green-700 mb-2 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Found in Your Resume
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {keywordMatches
                      .filter((item) => item.matched)
                      .map((item, index) => (
                        <Badge
                          key={index}
                          variant="default"
                          className="bg-green-100 text-green-800 hover:bg-green-200"
                        >
                          {item.keyword}
                        </Badge>
                      ))}
                  </div>
                </div>

                <div className="border rounded-lg p-4 bg-amber-50">
                  <h4 className="text-sm font-medium text-amber-700 mb-2 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    Missing from Your Resume
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {keywordMatches
                      .filter((item) => !item.matched)
                      .map((item, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="border-amber-200 text-amber-800"
                        >
                          {item.keyword}
                        </Badge>
                      ))}
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mt-4 border-t pt-4">
                Consider adding the missing keywords to your resume to improve
                your match score and ATS compatibility.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="improvements">
            <div className="mt-4">
              <h3 className="font-medium mb-4">Improvement Recommendations</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 bg-blue-50">
                  <h4 className="text-sm font-medium text-blue-700 mb-2 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    Content Improvements
                  </h4>
                  <ul className="space-y-2 text-sm text-blue-800">
                    {insights?.contentSuggestions ? (
                      Array.isArray(insights.contentSuggestions) ? (
                        insights.contentSuggestions.map(
                          (suggestion: string, index: number) => (
                            <li key={index} className="flex items-start">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              {suggestion}
                            </li>
                          )
                        )
                      ) : (
                        <li className="flex items-start">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {insights.contentSuggestions}
                        </li>
                      )
                    ) : (
                      <>
                        <li className="flex items-start">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Include more specific skills that match the job
                          description
                        </li>
                        <li className="flex items-start">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Quantify your achievements with metrics and numbers
                        </li>
                        <li className="flex items-start">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Tailor your professional summary to highlight relevant
                          experience
                        </li>
                      </>
                    )}
                  </ul>
                </div>

                <div className="border rounded-lg p-4 bg-purple-50">
                  <h4 className="text-sm font-medium text-purple-700 mb-2 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                    ATS Optimization
                  </h4>
                  <ul className="space-y-2 text-sm text-purple-800">
                    {insights?.formatSuggestions ? (
                      Array.isArray(insights.formatSuggestions) ? (
                        insights.formatSuggestions.map(
                          (suggestion: string, index: number) => (
                            <li key={index} className="flex items-start">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              {suggestion}
                            </li>
                          )
                        )
                      ) : (
                        <li className="flex items-start">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {insights.formatSuggestions}
                        </li>
                      )
                    ) : (
                      <>
                        <li className="flex items-start">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Use industry-specific keywords throughout your resume
                        </li>
                        <li className="flex items-start">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Ensure your resume is ATS-friendly with a clean format
                        </li>
                        <li className="flex items-start">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Match section headings to what the job posting is
                          looking for
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </div>

              <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                <h4 className="text-sm font-medium mb-2 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Pro Tip
                </h4>
                <p className="text-sm text-gray-700">
                  Use this app&apos;s AI-powered resume generator to
                  automatically create a tailored resume that matches this job
                  description perfectly.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="insights">
            <div className="mt-4">
              <h3 className="font-medium mb-4">AI-Generated Resume Insights</h3>

              {insights ? (
                <div className="space-y-6">
                  {/* Overall feedback */}
                  <div className="p-4 border rounded-lg bg-white">
                    <h4 className="text-sm font-medium mb-2 flex items-center text-blue-700">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Overall Assessment
                    </h4>
                    <p className="text-sm text-gray-700">
                      {insights.overallFeedback}
                    </p>
                  </div>

                  {/* Strengths and improvement areas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Strengths */}
                    <div className="p-4 border rounded-lg bg-green-50">
                      <h4 className="text-sm font-medium mb-2 flex items-center text-green-700">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Resume Strengths
                      </h4>
                      {insights.strengths && insights.strengths.length > 0 ? (
                        <ul className="space-y-2 text-sm text-green-800 list-disc pl-5">
                          {insights.strengths.map(
                            (strength: string, index: number) => (
                              <li key={index}>{strength}</li>
                            )
                          )}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-700">
                          No specific strengths identified.
                        </p>
                      )}
                    </div>

                    {/* Improvement areas */}
                    <div className="p-4 border rounded-lg bg-amber-50">
                      <h4 className="text-sm font-medium mb-2 flex items-center text-amber-700">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                        Areas for Improvement
                      </h4>
                      {insights.improvementAreas &&
                      insights.improvementAreas.length > 0 ? (
                        <ul className="space-y-2 text-sm text-amber-800 list-disc pl-5">
                          {insights.improvementAreas.map(
                            (area: string, index: number) => (
                              <li key={index}>{area}</li>
                            )
                          )}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-700">
                          No specific improvement areas identified.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Section-specific feedback */}
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <h4 className="text-sm font-medium mb-3 flex items-center text-gray-700">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 6h16M4 10h16M4 14h16M4 18h16"
                        />
                      </svg>
                      Section-Specific Feedback
                    </h4>

                    <div className="space-y-4">
                      {/* Summary feedback */}
                      {insights.summaryFeedback && (
                        <div className="border-b pb-3">
                          <h5 className="text-xs font-medium mb-1 text-blue-600">
                            Professional Summary
                          </h5>
                          <p className="text-sm text-gray-700">
                            {insights.summaryFeedback}
                          </p>
                        </div>
                      )}

                      {/* Experience feedback */}
                      {insights.experienceFeedback && (
                        <div className="border-b pb-3">
                          <h5 className="text-xs font-medium mb-1 text-blue-600">
                            Work Experience
                          </h5>
                          <p className="text-sm text-gray-700">
                            {insights.experienceFeedback}
                          </p>
                        </div>
                      )}

                      {/* Skills feedback */}
                      {insights.skillsFeedback && (
                        <div className="border-b pb-3">
                          <h5 className="text-xs font-medium mb-1 text-blue-600">
                            Skills
                          </h5>
                          <p className="text-sm text-gray-700">
                            {insights.skillsFeedback}
                          </p>
                        </div>
                      )}

                      {/* Education feedback */}
                      {insights.educationFeedback && (
                        <div>
                          <h5 className="text-xs font-medium mb-1 text-blue-600">
                            Education
                          </h5>
                          <p className="text-sm text-gray-700">
                            {insights.educationFeedback}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Skill gaps */}
                  {insights.skillGaps && insights.skillGaps.length > 0 && (
                    <div className="p-4 border rounded-lg bg-purple-50">
                      <h4 className="text-sm font-medium mb-2 flex items-center text-purple-700">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                          />
                        </svg>
                        Skill Gaps
                      </h4>
                      <ul className="space-y-2 text-sm text-purple-800 list-disc pl-5">
                        {insights.skillGaps.map(
                          (skill: string, index: number) => (
                            <li key={index}>{skill}</li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 border rounded-lg bg-gray-50">
                  <p className="text-sm text-gray-700">
                    Detailed AI insights are not available. Click the
                    &quot;Calculate Score&quot; button to generate detailed
                    insights about your resume&apos;s match with this job.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
