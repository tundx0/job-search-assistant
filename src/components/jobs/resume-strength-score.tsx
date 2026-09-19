"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    if (score >= 80) return "var(--success)";
    if (score >= 60) return "var(--primary)";
    if (score >= 40) return "var(--warning)";
    return "var(--destructive)";
  };

  // Get text based on score
  const getScoreText = (score: number) => {
    if (score >= 80) return "Excellent Match";
    if (score >= 60) return "Good Match";
    if (score >= 40) return "Average Match";
    if (score >= 20) return "Below Average";
    return "Poor Match";
  };

  // Only report keywords the analysis actually returned. When there are none,
  // the keyword panels show an empty state rather than invented matches.
  const keywordMatches: { keyword: string; matched: boolean }[] =
    insights?.missingKeywords?.map((keyword: string) => ({
      keyword,
      matched: false,
    })) ?? [];

  return (
    <Card className="w-full overflow-hidden">
      <div className="h-1" style={{ backgroundColor: getScoreColor(score) }} />
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Resume strength
              <span
                className="chip"
                style={{
                  borderColor: getScoreColor(score),
                  color: getScoreColor(score),
                }}
              >
                {getScoreText(score)}
              </span>
            </CardTitle>
            <CardDescription className="mt-1">
              How well your resume matches the {jobTitle} position
            </CardDescription>
          </div>

          <div className="relative flex h-24 w-24 flex-none items-center justify-center">
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="font-heading text-2xl font-semibold tabular-nums"
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
                stroke="var(--muted)"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={getScoreColor(score)}
                strokeWidth="8"
                strokeDasharray={`${(2 * Math.PI * 45 * score) / 100} ${
                  (2 * Math.PI * 45 * (100 - score)) / 100
                }`}
              />
            </svg>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-7">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-full bg-accent rounded-full h-2.5">
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
              ? "Your resume is an excellent match for this position. You’re well-positioned to stand out to recruiters."
              : score >= 60
              ? "Your resume shows a good match with this job. With a few tweaks, you could improve your chances even more."
              : score >= 40
              ? "Your resume has moderate alignment with this position. Consider enhancing key sections to improve your match."
              : "Your resume needs significant improvements to better match this job’s requirements."}
          </p>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="keywords">Keywords</TabsTrigger>
            <TabsTrigger value="improvements">Improvements</TabsTrigger>
            <TabsTrigger value="insights">AI insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="pt-6">
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-[var(--rule)] sm:grid-cols-4">
              <div className="bg-card p-4">
                <dt className="label-mono">Match</dt>
                <dd className="stat-value mt-2" style={{ color: getScoreColor(score) }}>
                  {score}%
                </dd>
              </div>
              <div className="bg-card p-4">
                <dt className="label-mono">Strengths</dt>
                <dd className="stat-value mt-2">{insights?.strengths?.length ?? 0}</dd>
              </div>
              <div className="bg-card p-4">
                <dt className="label-mono">To improve</dt>
                <dd className="stat-value mt-2">
                  {insights?.improvementAreas?.length ?? 0}
                </dd>
              </div>
              <div className="bg-card p-4">
                <dt className="label-mono">Missing terms</dt>
                <dd className="stat-value mt-2">{keywordMatches.length}</dd>
              </div>
            </dl>

            <p className="mt-5 text-sm text-muted-foreground">
              Your resume scores <strong className="text-foreground">{score}%</strong>{" "}
              against this posting.{" "}
              {score >= 60
                ? "That is a strong match with the stated requirements."
                : score >= 40
                ? "Tightening the sections below should raise it."
                : "The gaps below are the ones worth closing first."}
            </p>
          </TabsContent>

          <TabsContent value="keywords">
            <div className="mt-4">
              <h3 className="font-medium mb-4">Key terms in the job description</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="panel-success">
                  <h4 className="text-sm font-medium text-success mb-2 flex items-center">
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
                        <span key={index} className="chip chip-success">
                          {item.keyword}
                        </span>
                      ))}
                  </div>
                </div>

                <div className="panel-warning">
                  <h4 className="text-sm font-medium text-warning mb-2 flex items-center">
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
                    Missing from your resume
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {keywordMatches
                      .filter((item) => !item.matched)
                      .map((item, index) => (
                        <span key={index} className="chip chip-warning">
                          {item.keyword}
                        </span>
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
                <div className="panel-info">
                  <h4 className="text-sm font-medium text-info mb-2 flex items-center">
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
                  <ul className="space-y-2 text-sm text-info">
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

                <div className="panel-insight">
                  <h4 className="text-sm font-medium text-insight mb-2 flex items-center">
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
                  <ul className="space-y-2 text-sm text-insight">
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

              <div className="mt-4 p-4 border rounded-lg bg-muted">
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
                <p className="text-sm text-foreground">
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
                  <div className="p-4 border rounded-lg bg-card">
                    <h4 className="text-sm font-medium mb-2 flex items-center text-info">
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
                    <p className="text-sm text-foreground">
                      {insights.overallFeedback}
                    </p>
                  </div>

                  {/* Strengths and improvement areas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Strengths */}
                    <div className="panel-success">
                      <h4 className="text-sm font-medium mb-2 flex items-center text-success">
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
                        <ul className="space-y-2 text-sm text-success list-disc pl-5">
                          {insights.strengths.map(
                            (strength: string, index: number) => (
                              <li key={index}>{strength}</li>
                            )
                          )}
                        </ul>
                      ) : (
                        <p className="text-sm text-foreground">
                          No specific strengths identified.
                        </p>
                      )}
                    </div>

                    {/* Improvement areas */}
                    <div className="panel-warning">
                      <h4 className="text-sm font-medium mb-2 flex items-center text-warning">
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
                        <ul className="space-y-2 text-sm text-warning list-disc pl-5">
                          {insights.improvementAreas.map(
                            (area: string, index: number) => (
                              <li key={index}>{area}</li>
                            )
                          )}
                        </ul>
                      ) : (
                        <p className="text-sm text-foreground">
                          No specific improvement areas identified.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Section-specific feedback */}
                  <div className="p-4 border rounded-lg bg-muted">
                    <h4 className="text-sm font-medium mb-3 flex items-center text-foreground">
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
                          <h5 className="text-xs font-medium mb-1 text-info">
                            Professional Summary
                          </h5>
                          <p className="text-sm text-foreground">
                            {insights.summaryFeedback}
                          </p>
                        </div>
                      )}

                      {/* Experience feedback */}
                      {insights.experienceFeedback && (
                        <div className="border-b pb-3">
                          <h5 className="text-xs font-medium mb-1 text-info">
                            Work Experience
                          </h5>
                          <p className="text-sm text-foreground">
                            {insights.experienceFeedback}
                          </p>
                        </div>
                      )}

                      {/* Skills feedback */}
                      {insights.skillsFeedback && (
                        <div className="border-b pb-3">
                          <h5 className="text-xs font-medium mb-1 text-info">
                            Skills
                          </h5>
                          <p className="text-sm text-foreground">
                            {insights.skillsFeedback}
                          </p>
                        </div>
                      )}

                      {/* Education feedback */}
                      {insights.educationFeedback && (
                        <div>
                          <h5 className="text-xs font-medium mb-1 text-info">
                            Education
                          </h5>
                          <p className="text-sm text-foreground">
                            {insights.educationFeedback}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Skill gaps */}
                  {insights.skillGaps && insights.skillGaps.length > 0 && (
                    <div className="panel-insight">
                      <h4 className="text-sm font-medium mb-2 flex items-center text-insight">
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
                      <ul className="space-y-2 text-sm text-insight list-disc pl-5">
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
                <div className="p-4 border rounded-lg bg-muted">
                  <p className="text-sm text-foreground">
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
