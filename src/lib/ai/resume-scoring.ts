import { generateText } from "./provider";
import { ResumeJSON } from "./simple-json-generation";
import { createObjectHash } from "../utils/hash";
import { ResumeInsight } from "@/types";

// Cache for storing generated content to avoid redundant API calls
const generationCache = new Map<string, string>();

// Extended ResumeInsight type that includes score for internal use
export interface ResumeInsightData extends ResumeInsight {
  score: number;
}

/**
 * Calculate the strength score of a resume for a specific job using AI
 * @param resume The resume content
 * @param jobDescription The job description
 * @param jobTitle The job title
 * @returns A ResumeInsightData object containing the score and detailed insights
 */
export async function calculateResumeStrengthWithAI(
  resume: ResumeJSON,
  jobDescription: string,
  jobTitle: string
): Promise<ResumeInsightData> {
  // Create a deterministic hash of the resume and job description for caching
  const resumeHash = createObjectHash(resume);
  const jobHash = createObjectHash(jobDescription);
  const cacheKey = `resume-insights-${jobTitle}-${resumeHash}-${jobHash}`;

  // Check if we have a cached version (for now, we'll disable caching for detailed insights)
  // if (generationCache.has(cacheKey)) {
  //   return JSON.parse(generationCache.get(cacheKey)!);
  // }

  try {
    const systemPrompt = `
    You are an expert ATS (Applicant Tracking System) and resume evaluation specialist with years of experience in HR and recruitment.
    Your job is to provide detailed, actionable feedback on how well a resume matches a job description.
    You have deep knowledge of industry-specific keywords, skills, and qualifications across various fields.
    Your analysis should be thorough, specific, and focused on helping the candidate improve their resume to achieve at least a 95% match score.
    `;

    const prompt = `
I need you to evaluate how well the following resume matches the job description and title provided.

First, rate the match on a scale from 0 to 100, where:
- 0-20: Poor match, missing most key requirements
- 21-40: Below average match, missing many key requirements
- 41-60: Average match, meets some requirements but lacks others
- 61-80: Good match, meets most requirements with some gaps
- 81-100: Excellent match, meets or exceeds all key requirements

Then, provide detailed insights in the following JSON format:

{
  "score": [number between 0-100],
  "overallFeedback": "[A paragraph summarizing the overall match and key recommendations]",
  "improvementAreas": ["Area 1", "Area 2", ...],
  "strengths": ["Strength 1", "Strength 2", ...],
  "missingKeywords": ["Keyword 1", "Keyword 2", ...],
  "skillGaps": ["Skill 1", "Skill 2", ...],
  "formatSuggestions": "[Suggestions for improving resume format]",
  "contentSuggestions": "[Suggestions for improving resume content]",
  "summaryFeedback": "[Feedback on professional summary/objective]",
  "experienceFeedback": "[Feedback on work experience section]",
  "educationFeedback": "[Feedback on education section]",
  "skillsFeedback": "[Feedback on skills section]"
}

IMPORTANT: 
1. Be extremely specific about what's missing and what should be added to achieve a 95%+ match score.
2. For each missing keyword or skill, suggest exactly how it should be incorporated.
3. Provide actionable advice that can be directly implemented.
4. Return ONLY valid JSON that matches the format above. No additional text or explanation.

JOB TITLE: ${jobTitle}

JOB DESCRIPTION:
${jobDescription}

RESUME:
${JSON.stringify(resume)}
`;

    // Generate the detailed insights using the configured AI provider
    const result = await generateText(prompt, systemPrompt, {
      temperature: 0.2, // Lower temperature for more consistent analysis
      maxTokens: 2000, // We need a longer response for detailed insights
    });

    // Parse the JSON response
    try {
      // Find JSON in the response (in case there's any extra text)
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      
      const insights: ResumeInsightData = JSON.parse(jsonMatch[0]);
      
      // Validate the required fields
      if (typeof insights.score !== 'number' || 
          !insights.overallFeedback || 
          !Array.isArray(insights.improvementAreas) || 
          !Array.isArray(insights.strengths) || 
          !Array.isArray(insights.missingKeywords) || 
          !Array.isArray(insights.skillGaps)) {
        throw new Error("Invalid insights format");
      }
      
      // Ensure score is within range
      insights.score = Math.min(100, Math.max(0, insights.score));
      
      // Cache the result
      generationCache.set(cacheKey, JSON.stringify(insights));
      
      return insights;
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError, "\nResponse:", result);
      
      // Fallback to a basic response if parsing fails
      return {
        score: 50,
        overallFeedback: "Unable to generate detailed insights. Please try again later.",
        improvementAreas: ["N/A"],
        strengths: ["N/A"],
        missingKeywords: ["N/A"],
        skillGaps: ["N/A"]
      };
    }
  } catch (error) {
    console.error("Error calculating resume insights with AI:", error);

    // Fallback to a basic response if AI fails
    return {
      score: 50,
      overallFeedback: "Unable to generate detailed insights. Please try again later.",
      improvementAreas: ["N/A"],
      strengths: ["N/A"],
      missingKeywords: ["N/A"],
      skillGaps: ["N/A"]
    };
  }
}
