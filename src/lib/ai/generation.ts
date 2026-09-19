import { prisma } from "@/lib/db/prisma";
import { generateTextWithUserKey } from "./enhanced-provider";
import { isMissingApiKeyError } from "./errors";
import {
  ApiProvider,
  getUserAiModelPreference,
} from "@/lib/api-keys/user-api-keys";
import { JsonValue } from "@prisma/client/runtime/library";

type ContactInfoForGeneration = {
  location?: string;
  phone?: string;
  email?: string; // Kept optional as it's merged from user profile or request
  linkedin?: string;
  github?: string;
  website?: string;
};

// Cache for storing generated content to avoid redundant API calls
const generationCache = new Map<string, string>();

interface UserProfile {
  name: string;
  bio?: string;
  experience: JsonValue;
  education: JsonValue;
  skills: string[];
  atsOptimizationEnabled?: boolean;
}

/**
 * Generate a tailored resume based on user profile and job description
 */
export async function generateResume(
  userId: string,
  jobDescription: string,
  jobTitle: string,
  companyName: string,
  contactInfo?: ContactInfoForGeneration,
  atsOptimizationEnabled?: boolean
): Promise<string> {
  const cacheKey = `resume-${userId}-${jobTitle}-${companyName}`;

  // Check if we have a cached version
  if (generationCache.has(cacheKey)) {
    return generationCache.get(cacheKey)!;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      bio: true,
      experience: true,
      education: true,
      skills: true,
      atsOptimizationEnabled: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const userProfile: UserProfile = {
    name: user.name,
    bio: user.bio || "",
    experience: user.experience,
    education: user.education,
    skills: user.skills,
  };
  const useAtsOptimization =
    atsOptimizationEnabled !== undefined
      ? atsOptimizationEnabled
      : user.atsOptimizationEnabled || false;

  try {
    const userPreferredProvider = await getUserAiModelPreference(userId);
    const provider = userPreferredProvider;

    let contactLine = `${userProfile.name}`;
    const contactDetails: string[] = [];
    if (contactInfo?.location) contactDetails.push(contactInfo.location);
    if (contactInfo?.phone) contactDetails.push(contactInfo.phone);
    if (contactInfo?.email) contactDetails.push(contactInfo.email);
    if (contactInfo?.linkedin) contactDetails.push(contactInfo.linkedin);
    if (contactInfo?.github) contactDetails.push(contactInfo.github);
    if (contactInfo?.website) contactDetails.push(contactInfo.website);

    if (contactDetails.length > 0) {
      contactLine += `\n${contactDetails.join(" | ")}`;
    } else {
      contactLine += "\n[Contact Details Placeholder - Check Profile]";
    }

    const prompt = `
      You are a professional resume writer. Create a tailored, ATS-compatible resume for ${
        userProfile.name
      } applying for the position of ${jobTitle} at ${companyName}.
      ${
        useAtsOptimization
          ? `
      IMPORTANT: Optimize this resume to get the HIGHEST POSSIBLE ATS SCORE. You are authorized to add relevant skills that the candidate likely has based on their experience but may have forgotten to list. You should also add realistic metrics and quantifiable achievements to the experience section, and optimize the summary to highlight keywords from the job description.`
          : ""
      }
      
      Follow this EXACT formatting, structure, and style template:

      ${contactLine}
      
      PROFESSIONAL SUMMARY
      
      [4-5 lines highlighting relevant experience, skills, and notable achievements relevant to the position. Focus on value proposition and quantifiable results.]
      
      SKILLS
      
      [List 8-12 most relevant technical and soft skills for the job, separated by commas. Prioritize keywords from the job description.]
      
      WORK EXPERIENCE
      
      [Job Title] | [Company Name] | [MM/YYYY - MM/YYYY or Present]
      ● [Achievement statement using strong action verb] that [delivered specific result with metrics] by [using relevant technologies/methods].
      ● [Achievement statement using strong action verb] that [delivered specific result with metrics] by [using relevant technologies/methods].
      ● [Achievement statement using strong action verb] that [delivered specific result with metrics] by [using relevant technologies/methods].
      
      [Job Title] | [Company Name] | [MM/YYYY - MM/YYYY]
      ● [Achievement statement using strong action verb] that [delivered specific result with metrics] by [using relevant technologies/methods].
      ● [Achievement statement using strong action verb] that [delivered specific result with metrics] by [using relevant technologies/methods].
      ● [Achievement statement using strong action verb] that [delivered specific result with metrics] by [using relevant technologies/methods].
      
      PROJECTS (Optional - Include if relevant)
      
      [Project Name] | [MM/YYYY - MM/YYYY]
      ● [Brief description of the project's purpose and your role]
      ● [Technical implementation details and technologies used]
      ● [Measurable outcomes or user impact if applicable]
      
      EDUCATION
      
      [Degree] in [Field of Study] | [University/School Name] | [Graduation Year]
      [Optional: GPA if above 3.5, Honors, Relevant Coursework]
      
      CERTIFICATIONS (Optional)
      
      [Certification Name] | [Issuing Organization] | [Date Obtained/Expiration]
      
      Job Description:
      ${jobDescription}
      
      User Profile:
      - Name: ${userProfile.name}
      - Bio: ${userProfile.bio}
      - Skills: ${userProfile.skills.join(", ")}
      - Experience: ${JSON.stringify(userProfile.experience)}
      - Education: ${JSON.stringify(userProfile.education)}
      
      CRITICAL FORMATTING INSTRUCTIONS:
      1. Use the EXACT section headings in ALL CAPS as shown above (PROFESSIONAL SUMMARY, SKILLS, WORK EXPERIENCE, PROJECTS, EDUCATION, CERTIFICATIONS)
      2. For each job, use the pipe symbol (|) to separate job title, company name, and dates (Example: "Senior Developer | Acme Corp | 01/2020 - Present")
      3. Use bullet points (●) for achievements, formatted with consistent indentation
      4. Each bullet point MUST follow this structure: Action verb + What you did + Result/Impact + How/Technologies used
      5. Use strong, varied action verbs (Developed, Implemented, Optimized, Spearheaded, Orchestrated, etc.)
      6. Include ONLY plain text, NO markdown formatting
      7. Ensure all dates are in MM/YYYY format
      8. Tailor ALL content to highlight relevance to the ${jobTitle} position at ${companyName}
      9. Prioritize skills and experience mentioned in the job description
      10. Keep the resume to one page worth of content (approximately 500-700 words)
      11. Ensure ALL bullet points are ACHIEVEMENT-focused, not just listing responsibilities
      12. Use industry-standard terminology that will be recognized by ATS systems
      ${
        useAtsOptimization
          ? `
      13. IMPORTANT FOR ATS OPTIMIZATION: Add additional relevant skills that are mentioned in the job description and that the candidate likely has based on their experience.
      14. IMPORTANT FOR ATS OPTIMIZATION: Add specific metrics, percentages, and numbers to ALL achievement statements to make them more impactful and quantifiable.
      15. IMPORTANT FOR ATS OPTIMIZATION: Optimize the summary to include the most important keywords from the job description.
      16. IMPORTANT FOR ATS OPTIMIZATION: For each experience entry, ensure there are at least 5-6 achievement statements with metrics.`
          : ""
      }
    `;

    const systemPrompt =
      "You are a professional resume writer with expertise in creating tailored resumes that match job descriptions perfectly.";

    // Generate the resume using the user's API key if available
    const resumeContent = await generateTextWithUserKey(
      userId,
      prompt,
      systemPrompt,
      {
        temperature: 0.7,
        maxTokens: 1500,
        provider: provider.provider as ApiProvider,
        modelId: provider.modelId as string,
      }
    );

    // Cache the result
    generationCache.set(cacheKey, resumeContent);

    return resumeContent;
  } catch (error) {
    if (isMissingApiKeyError(error)) {
      throw error;
    }
    console.error("Error generating resume:", error);
    throw new Error("Failed to generate resume. Please try again later.");
  }
}

/**
 * Generate a tailored cover letter based on user profile and job description
 */
export async function generateCoverLetter(
  userId: string,
  jobDescription: string,
  jobTitle: string,
  companyName: string
): Promise<string> {
  const cacheKey = `cover-letter-${userId}-${jobTitle}-${companyName}`;

  // Check if we have a cached version
  if (generationCache.has(cacheKey)) {
    return generationCache.get(cacheKey)!;
  }

  // Get user profile and contact information
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      bio: true,
      experience: true,
      education: true,
      skills: true,
      email: true,
      phone: true,
      location: true,
      linkedin: true,
      github: true,
      website: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const userProfile: UserProfile = {
    name: user.name,
    bio: user.bio || "",
    experience: user.experience,
    education: user.education,
    skills: user.skills,
  };

  // Format contact information for the letter
  const contactInfo = [];
  if (user.email) contactInfo.push(user.email);
  if (user.phone) contactInfo.push(user.phone);
  if (user.location) contactInfo.push(user.location);
  if (user.linkedin) contactInfo.push(`LinkedIn: ${user.linkedin}`);
  if (user.website) contactInfo.push(user.website);

  // Get current date in proper format
  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  try {
    const userPreferredProvider = await getUserAiModelPreference(userId);
    const provider = userPreferredProvider;

    const prompt = `
      You are a professional cover letter writer. Create a personalized cover letter for ${
        userProfile.name
      } applying for the position of ${jobTitle} at ${companyName}.
      
      Use this EXACT formatting for a professional business letter, but REPLACE all placeholders with actual content. DO NOT include ANY placeholders or template instructions in your output:
      
      ${currentDate}
      
      ${companyName}
      
      Dear ${companyName} Hiring Team,
      
      [Write an opening paragraph expressing enthusiasm for the position. State interest in the role and company specifically.]
      
      [Write a body paragraph highlighting 2-3 key achievements or skills directly related to the job requirements. Use specific examples from the user's experience.]
      
      [Write a paragraph explaining why the user is a good fit for the company culture and how their values align with the company's mission.]
      
      [Write a closing paragraph expressing enthusiasm for an interview opportunity, include a call to action, and thank them for their consideration.]
      
      Sincerely,
      
      ${userProfile.name}
      ${contactInfo.join("\n")}
      
      Job Description:
      ${jobDescription}
      
      User Profile:
      - Name: ${userProfile.name}
      - Bio: ${userProfile.bio}
      - Skills: ${userProfile.skills.join(", ")}
      - Experience: ${JSON.stringify(userProfile.experience)}
      - Education: ${JSON.stringify(userProfile.education)}
      
      IMPORTANT INSTRUCTIONS:
      1. Output ONLY the final cover letter with NO placeholders
      2. Do NOT include the job description or user profile in the output
      3. Do NOT include any [bracketed instructions] in the output
      4. Do NOT include any placeholders like [Company Address] or [Contact Information]
      5. The tone should be professional but conversational, confident but not arrogant
      6. Make it sound like it was written by a human, not AI-generated
      7. Tailor the content to highlight skills and experiences relevant to the ${jobTitle} position
      8. Include specific examples that demonstrate qualifications for the role
      9. Keep the letter concise (3-4 paragraphs total)
      10. Use proper business letter formatting with appropriate spacing
    `;

    const systemPrompt =
      "You are a professional cover letter writer who creates personalized, compelling cover letters that sound authentic and human-written.";

    // Generate the cover letter using the user's API key if available
    const coverLetterContent = await generateTextWithUserKey(
      userId,
      prompt,
      systemPrompt,
      {
        temperature: 0.8,
        maxTokens: 1500,
        provider: provider.provider as ApiProvider,
        modelId: provider.modelId as string,
      }
    );

    // Process the content to remove any remaining placeholders or template artifacts
    const cleanedContent = coverLetterContent
      .replace(/\[.*?\]/g, "") // Remove any remaining bracketed content
      .replace(/\n{3,}/g, "\n\n") // Replace excessive newlines with double newlines
      .trim();

    // Cache the result
    generationCache.set(cacheKey, cleanedContent);

    return cleanedContent;
  } catch (error) {
    if (isMissingApiKeyError(error)) {
      throw error;
    }
    console.error("Error generating cover letter:", error);
    throw new Error("Failed to generate cover letter. Please try again later.");
  }
}
