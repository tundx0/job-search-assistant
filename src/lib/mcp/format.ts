import type { JobApplication, ResumeInsight } from "@prisma/client";

/**
 * Job descriptions run to several kilobytes each. Listing a dozen in full
 * would spend more context than the answer is worth, so list rows carry only
 * what is needed to choose one.
 */
const DESCRIPTION_PREVIEW_CHARS = 400;

export function toListRow(app: JobApplication) {
  return {
    id: app.id,
    jobTitle: app.jobTitle,
    companyName: app.companyName,
    status: app.status,
    strengthScore: app.strengthScore,
    hasDocuments: Boolean(app.tailoredResume && app.coverLetter),
    createdAt: app.createdAt.toISOString(),
  };
}

export function toDetail(
  app: JobApplication & { resumeInsight?: ResumeInsight | null },
  options: { full?: boolean } = {}
) {
  const description = options.full
    ? app.jobDescription
    : truncate(app.jobDescription, DESCRIPTION_PREVIEW_CHARS);

  return {
    id: app.id,
    jobTitle: app.jobTitle,
    companyName: app.companyName,
    status: app.status,
    jobUrl: app.jobUrl,
    strengthScore: app.strengthScore,
    jobDescription: description,
    jobDescriptionTruncated: !options.full && description !== app.jobDescription,
    documents: {
      resume: app.tailoredResume || null,
      coverLetter: app.coverLetter || null,
      resumePdf: app.tailoredResumePdf || null,
    },
    insight: app.resumeInsight
      ? {
          overallFeedback: app.resumeInsight.overallFeedback,
          strengths: app.resumeInsight.strengths,
          improvementAreas: app.resumeInsight.improvementAreas,
          missingKeywords: app.resumeInsight.missingKeywords,
          skillGaps: app.resumeInsight.skillGaps,
        }
      : null,
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
  };
}

function truncate(value: string, max: number) {
  if (value.length <= max) return value;
  return `${value.slice(0, max).trimEnd()}…`;
}
