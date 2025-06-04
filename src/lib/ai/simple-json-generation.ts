import { prisma } from "@/lib/db/prisma";
import { getAIProvider } from "./provider";
import { generateTextWithUserKey } from "./enhanced-provider";
import {
  ApiProvider,
  getUserAiModelPreference,
} from "@/lib/api-keys/user-api-keys";
import { createObjectHash } from "../utils/hash";

// Cache for storing generated content to avoid redundant API calls
const generationCache = new Map<string, string>();

// Define the resume JSON structure
export interface ResumeJSON {
  header: {
    name: string;
    contact: {
      location: string;
      phone?: string;
      email: string;
      links?: string[];
    };
  };
  summary: string;
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    location?: string;
    startDate: string;
    endDate: string;
    achievements: string[];
  }>;
  projects?: Array<{
    name: string;
    startDate?: string;
    endDate?: string;
    description: string[];
  }>;
  education: Array<{
    degree: string;
    field: string;
    institution: string;
    location?: string;
    graduationDate: string;
    details?: string[];
  }>;
  certifications?: Array<{
    name: string;
    issuer: string;
    date: string;
    details?: string;
  }>;
}

/**
 * Generate a tailored resume in JSON format based on user profile and job description
 */
// Define the contact info interface to match the schema in the API
export interface ContactInfo {
  location?: string;
  phone?: string;
  email: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

export async function generateResumeJSON(
  userId: string,
  jobDescription: string,
  jobTitle: string,
  companyName: string,
  contactInfo?: ContactInfo,
  atsOptimizationEnabled?: boolean
): Promise<ResumeJSON> {
  // Create a deterministic hash for caching based on inputs that affect the generation
  const jobHash = createObjectHash(jobDescription);
  const titleHash = createObjectHash(jobTitle);
  const companyHash = createObjectHash(companyName);
  const atsOptFlag = atsOptimizationEnabled ? "-ats-opt" : "";
  const cacheKey = `resume-json-${userId}-${titleHash}-${companyHash}-${jobHash}${atsOptFlag}`;

  // Check if we have a cached version
  if (generationCache.has(cacheKey)) {
    console.log(`Cache hit for resume JSON generation: ${cacheKey}`);
    return JSON.parse(generationCache.get(cacheKey)!);
  }

  console.log(`Cache miss for resume JSON generation: ${cacheKey}`);

  // Get user profile with all necessary fields including experience, education, projects and ATS optimization preference
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      bio: true,
      skills: true,
      email: true,
      experience: true,
      education: true,
      location: true,
      phone: true,
      linkedin: true,
      github: true,
      website: true,
      atsOptimizationEnabled: true,
    },
  });

  // Use the passed atsOptimizationEnabled parameter if provided, otherwise use the user's preference
  const useAtsOptimization =
    atsOptimizationEnabled !== undefined
      ? atsOptimizationEnabled
      : user?.atsOptimizationEnabled || false;

  // Try to get projects data using raw query to avoid TypeScript errors
  // This is needed because the projects field might not be in the Prisma schema yet
  const userWithProjects =
    await prisma.$queryRaw`SELECT projects FROM "User" WHERE id = ${userId}`.catch(
      () => null
    );

  if (!user) {
    throw new Error("User not found");
  }

  // Parse and validate user experience and education data
  interface UserExperience {
    company: string;
    title: string;
    startDate: string;
    endDate: string;
    description: string[];
    location?: string;
  }

  interface UserEducation {
    institution: string;
    degree: string;
    field: string;
    graduationDate: string;
    details?: string[];
    location?: string;
  }

  interface UserProject {
    name: string;
    startDate?: string;
    endDate?: string;
    description: string[];
  }

  let userExperience: UserExperience[] = [];
  let userEducation: UserEducation[] = [];
  let userProjects: UserProject[] = [];

  try {
    // Try to parse projects from raw query result
    if (
      userWithProjects &&
      Array.isArray(userWithProjects) &&
      userWithProjects.length > 0 &&
      userWithProjects[0].projects
    ) {
      try {
        const projectsData = userWithProjects[0].projects;
        if (typeof projectsData === "object" && Array.isArray(projectsData)) {
          // Convert each item to the expected format with type safety
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          userProjects = projectsData.map((proj: any) => {
            if (typeof proj === "object" && proj !== null) {
              const projObj = proj as Record<string, unknown>;
              // Handle description as either string or array
              let descriptions: string[] = [];
              if (typeof projObj.description === "string") {
                descriptions = [projObj.description];
              } else if (Array.isArray(projObj.description)) {
                descriptions = projObj.description.map((d: unknown) =>
                  String(d)
                );
              }

              return {
                name: String(projObj.name || ""),
                startDate: projObj.startDate
                  ? String(projObj.startDate)
                  : undefined,
                endDate: projObj.endDate ? String(projObj.endDate) : undefined,
                description: descriptions,
              };
            }
            return {
              name: "",
              description: [],
            };
          });
        }
      } catch (error) {
        console.error("Error parsing projects data:", error);
        // Continue without projects data
      }
    }

    if (user.experience && typeof user.experience === "object") {
      if (Array.isArray(user.experience)) {
        // Convert each item to the expected format with type safety
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        userExperience = user.experience.map((exp: any) => {
          if (typeof exp === "object" && exp !== null) {
            const expObj = exp as Record<string, unknown>;
            // Handle description as either string or array
            let descriptions: string[] = [];
            if (typeof expObj.description === "string") {
              descriptions = [expObj.description];
            } else if (Array.isArray(expObj.description)) {
              descriptions = expObj.description.map((d: unknown) => String(d));
            }

            return {
              company: String(expObj.company || ""),
              title: String(expObj.title || ""),
              startDate: String(expObj.startDate || ""),
              endDate: String(expObj.endDate || "Present"),
              location: String(expObj.location || ""),
              description: descriptions,
            };
          }
          return {
            company: "",
            title: "",
            startDate: "",
            endDate: "",
            description: [],
          };
        });
      }
    }

    if (user.education && typeof user.education === "object") {
      if (Array.isArray(user.education)) {
        // Convert each item to the expected format with type safety
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        userEducation = user.education.map((edu: any) => {
          if (typeof edu === "object" && edu !== null) {
            const eduObj = edu as Record<string, unknown>;
            // Extract field from degree if not present
            let degree = String(eduObj.degree || "");
            let field = String(eduObj.field || "");

            // If field is not present but degree contains field information
            if (!field && degree.includes(" ")) {
              const parts = degree.split(" ");
              if (parts.length >= 2) {
                degree = parts[0]; // First part as degree type (e.g., 'ND')
                field = parts.slice(1).join(" "); // Rest as field (e.g., 'Software Engineering')
              }
            }

            // Handle description/details as either string or array
            let details: string[] | undefined = undefined;
            if (typeof eduObj.description === "string") {
              details = [eduObj.description];
            } else if (Array.isArray(eduObj.description)) {
              details = eduObj.description.map((d: unknown) => String(d));
            } else if (typeof eduObj.details === "string") {
              details = [eduObj.details];
            } else if (Array.isArray(eduObj.details)) {
              details = eduObj.details.map((d: unknown) => String(d));
            }

            return {
              institution: String(eduObj.institution || ""),
              degree: degree,
              field: field,
              graduationDate: String(
                eduObj.endDate || eduObj.graduationDate || ""
              ),
              location: String(eduObj.location || ""),
              details: details,
            };
          }
          return {
            institution: "",
            degree: "",
            field: "",
            graduationDate: "",
          };
        });
      }
    }
  } catch (err) {
    console.error("Error parsing user profile data:", err);
  }

  // Create a user profile object for the AI to use
  const userProfile = {
    name: user.name,
    bio: user.bio || "",
    experience: userExperience,
    education: userEducation,
    projects: userProjects.length > 0 ? userProjects : undefined,
    skills: user.skills || [],
    email: contactInfo?.email || user.email || "",
    location: contactInfo?.location || user.location || "",
    phone: contactInfo?.phone || user.phone || "",
    linkedin: contactInfo?.linkedin || user.linkedin || "",
    github: contactInfo?.github || user.github || "",
    website: contactInfo?.website || user.website || "",
  };

  try {
    // Get user's preferred AI provider if available
    const userPreferredProvider = await getUserAiModelPreference(userId);

    // Default to system provider if user has no preference
    const provider = userPreferredProvider || getAIProvider();

    let prompt = `
      You are a professional resume writer. Create a tailored, ATS-compatible resume for ${
        userProfile.name
      } applying for the position of ${jobTitle} at ${companyName}.
      ${
        useAtsOptimization
          ? `
      IMPORTANT: Optimize this resume to get the HIGHEST POSSIBLE ATS SCORE. You are authorized to add relevant skills that the candidate likely has based on their experience but may have forgotten to list. You should also add realistic metrics and quantifiable achievements to the experience section, and optimize the summary to highlight keywords from the job description.`
          : ""
      }
      
      I need the resume in a structured JSON format following this exact schema:
      
      {
        "header": {
          "name": "Full Name",
          "contact": {
            "location": "City, State/Country (optional)",
            "phone": "Phone number (optional)",
            "email": "Email address",
            "links": ["LinkedIn URL", "GitHub URL", "Portfolio URL (optional)"]
          }
        },
        "summary": "4-5 lines highlighting relevant experience, skills, and notable achievements relevant to the position. Focus on value proposition and quantifiable results.",
        "skills": ["Skill 1", "Skill 2", "Skill 3", ...], // 8-12 most relevant skills
        "experience": [
          {
            "title": "Job Title",
            "company": "Company Name",
            "location": "City, State/Country (optional)",
            "startDate": "MM/YYYY",
            "endDate": "MM/YYYY or Present",
            "achievements": [
              "Achievement statement using strong action verb that delivered specific result with metrics by using relevant technologies/methods.",
              "Achievement statement using strong action verb that delivered specific result with metrics by using relevant technologies/methods."
            ]
          },
          // More experience entries...
        ],
        "projects": [
          {
            "name": "Project Name",
            "startDate": "MM/YYYY (optional)",
            "endDate": "MM/YYYY (optional)",
            "description": [
              "Brief description of the project's purpose and your role",
              "Technical implementation details and technologies used",
              "Measurable outcomes or user impact if applicable"
            ]
          }
          // More projects...
        ],
        "education": [
          {
            "degree": "Degree Type",
            "field": "Field of Study",
            "institution": "University/School Name",
            "location": "City, State/Country (optional)",
            "graduationDate": "YYYY",
            "details": ["GPA if above 3.5", "Honors", "Relevant Coursework (optional)"]
          }
          // More education entries...
        ],
        "certifications": [
          {
            "name": "Certification Name",
            "issuer": "Issuing Organization",
            "date": "MM/YYYY",
            "details": "Additional details (optional)"
          }
          // More certifications...
        ]
      }
      
      Job Description:
      ${jobDescription}
      
      User Profile:
      - Name: ${userProfile.name}
      - Bio: ${userProfile.bio}
      - Skills: ${userProfile.skills.join(", ")}
      
      IMPORTANT: Use ONLY the following real experience data for this user. DO NOT fabricate or invent any experience entries. Map this data exactly to the experience section in the output JSON.
      
      User's Real Experience:
      ${JSON.stringify(userProfile.experience, null, 2)}
      
      IMPORTANT: Use ONLY the following real education data for this user. DO NOT fabricate or invent any education entries. Map this data exactly to the education section in the output JSON.
      
      User's Real Education:
      ${JSON.stringify(userProfile.education, null, 2)}
      
      ${
        userProjects.length > 0
          ? `
      IMPORTANT: Use ONLY the following real projects data for this user. DO NOT fabricate or invent any project entries. Map this data exactly to the projects section in the output JSON.
      
      User's Real Projects:
      ${JSON.stringify(userProjects, null, 2)}
      `
          : ""
      }
      
      Contact Information:
      - Email: ${contactInfo?.email || userProfile.email}
      - Location: ${contactInfo?.location || userProfile.location || ""}
      - Phone: ${contactInfo?.phone || userProfile.phone || ""}
      - LinkedIn: ${contactInfo?.linkedin || userProfile.linkedin || ""}
      - GitHub: ${contactInfo?.github || userProfile.github || ""}
      - Website: ${contactInfo?.website || userProfile.website || ""}
      
      CRITICAL INSTRUCTIONS:
      1. Return ONLY valid JSON that matches the schema above exactly. No explanations, no markdown, just the JSON object.
      2. Tailor the resume to highlight skills and experiences relevant to the job description.
      3. Use the provided contact information in the header section.
      4. For each work experience entry, use the provided description to generate at least 4 achievement statements that demonstrate impact and value. These should go in the "achievements" array.
      5. For each project (if provided), use the project description to generate 2-3 bullet points highlighting technical details and outcomes. These should go in the "description" array.
      6. Include relevant skills from the user profile, prioritizing those most relevant to the job.
      7. Create a concise, impactful summary that positions the candidate as an ideal fit for the role.
      8. Format dates consistently as MM/YYYY.
      9. ${
        useAtsOptimization
          ? "Use strong action verbs and quantify achievements where possible (ALWAYS ADD SPECIFIC METRICS AND NUMBERS to make achievements more impactful)."
          : "Use strong action verbs and quantify achievements where possible (add metrics even if not explicitly mentioned)."
      }
      10. ONLY include sections that have data provided. If no projects are provided, omit the projects section entirely.
      11. If certifications are not provided, omit that section entirely.
      12. Ensure all content is ATS-friendly and keyword-optimized for the specific job.
      13. Ensure the JSON is properly formatted with no syntax errors.`;

    // Add additional ATS optimization instructions if enabled
    if (useAtsOptimization) {
      prompt += `
      14. IMPORTANT FOR ATS OPTIMIZATION: You may add additional relevant skills to the skills section that are mentioned in the job description and that the candidate likely has based on their experience but may have forgotten to list.
      15. IMPORTANT FOR ATS OPTIMIZATION: Add specific metrics, percentages, and numbers to ALL achievement statements to make them more impactful and quantifiable.
      16. IMPORTANT FOR ATS OPTIMIZATION: Optimize the summary to include the most important keywords from the job description.
      17. IMPORTANT FOR ATS OPTIMIZATION: For each experience entry, ensure there are at least 5-6 achievement statements with metrics.`;
    }

    const systemPrompt =
      "You are a professional resume writer with expertise in creating tailored resumes in structured JSON format that match job descriptions perfectly.";

    // Generate the resume using the user's preferred AI provider if available
    const resumeJSONString = await generateTextWithUserKey(
      userId,
      prompt,
      systemPrompt,
      {
        temperature: 0.7,
        maxTokens: 2500,
        provider: provider.provider as ApiProvider,
        modelId: provider.modelId as string,
      }
    );

    // Parse and validate the JSON
    let resumeJSON: ResumeJSON;
    try {
      // Clean the response in case there's any extra text before or after the JSON
      const jsonMatch = resumeJSONString.match(/\{[\s\S]*\}/);
      const cleanedJSON = jsonMatch ? jsonMatch[0] : resumeJSONString;
      resumeJSON = JSON.parse(cleanedJSON);

      // Validate required fields
      if (
        !resumeJSON.header ||
        !resumeJSON.summary ||
        !resumeJSON.skills ||
        !resumeJSON.experience ||
        !resumeJSON.education
      ) {
        throw new Error("Missing required fields in resume JSON");
      }

      // Ensure contact fields exist and have default empty values if missing
      if (!resumeJSON.header.contact) {
        resumeJSON.header.contact = {
          location: contactInfo?.location || userProfile.location || "",
          email: contactInfo?.email || userProfile.email || "",
          phone: contactInfo?.phone || userProfile.phone || "",
        };
      } else {
        // Set default values for any missing contact fields using provided contact info if available
        resumeJSON.header.contact.location =
          resumeJSON.header.contact.location ||
          contactInfo?.location ||
          userProfile.location ||
          "";
        resumeJSON.header.contact.email =
          resumeJSON.header.contact.email ||
          contactInfo?.email ||
          userProfile.email ||
          "";
        resumeJSON.header.contact.phone =
          resumeJSON.header.contact.phone ||
          contactInfo?.phone ||
          userProfile.phone ||
          "";

        // Ensure links array exists
        if (!resumeJSON.header.contact.links) {
          resumeJSON.header.contact.links = [];
        }

        // Add links from contact info if provided
        const links = resumeJSON.header.contact.links;
        if (
          (contactInfo?.linkedin || userProfile.linkedin) &&
          !links.some((link) => link.includes("linkedin"))
        ) {
          links.push(contactInfo?.linkedin || userProfile.linkedin || "");
        }
        if (
          (contactInfo?.github || userProfile.github) &&
          !links.some((link) => link.includes("github"))
        ) {
          links.push(contactInfo?.github || userProfile.github || "");
        }
        if (
          (contactInfo?.website || userProfile.website) &&
          !links.some(
            (link) =>
              (contactInfo?.website || userProfile.website) &&
              link.includes(contactInfo?.website || userProfile.website || "")
          )
        ) {
          links.push(contactInfo?.website || userProfile.website || "");
        }
      }

      // If the AI didn't properly use the real experience data, we can enforce it here
      if (
        userProfile.experience &&
        userProfile.experience.length > 0 &&
        (!resumeJSON.experience || resumeJSON.experience.length === 0)
      ) {
        // Map user experience to ResumeJSON format
        resumeJSON.experience = userProfile.experience.map((exp) => ({
          title: exp.title,
          company: exp.company,
          location: exp.location,
          startDate: exp.startDate,
          endDate: exp.endDate,
          achievements: Array.isArray(exp.description)
            ? exp.description
            : [exp.description || ""],
        }));
      }

      // If the AI didn't properly use the real education data, we can enforce it here
      if (
        userProfile.education &&
        userProfile.education.length > 0 &&
        (!resumeJSON.education || resumeJSON.education.length === 0)
      ) {
        // Map user education to ResumeJSON format
        resumeJSON.education = userProfile.education.map((edu) => ({
          degree: edu.degree,
          field: edu.field || "",
          institution: edu.institution,
          location: edu.location,
          graduationDate: edu.graduationDate,
          details: edu.details,
        }));
      }

      // If the AI didn't properly use the real projects data, we can enforce it here
      if (
        userProfile.projects &&
        userProfile.projects.length > 0 &&
        (!resumeJSON.projects || resumeJSON.projects.length === 0)
      ) {
        // Map user projects to ResumeJSON format
        resumeJSON.projects = userProfile.projects.map((proj) => ({
          name: proj.name,
          startDate: proj.startDate,
          endDate: proj.endDate,
          description: Array.isArray(proj.description)
            ? proj.description
            : [proj.description || ""],
        }));
      }
    } catch (error) {
      console.error("Error parsing resume JSON:", error, resumeJSONString);
      throw new Error(
        "Failed to generate valid resume JSON. Please try again."
      );
    }

    // Cache the result
    generationCache.set(cacheKey, JSON.stringify(resumeJSON));

    return resumeJSON;
  } catch (error) {
    console.error("Error generating resume JSON:", error);
    throw new Error("Failed to generate resume JSON. Please try again later.");
  }
}

/**
 * Convert a JSON resume to plain text format
 */
export function convertResumeJSONToText(resume: ResumeJSON): string {
  let text = "";

  // Header
  text += `${resume.header.name}\n`;
  const contactInfo = [
    resume.header.contact.location,
    resume.header.contact.phone,
    resume.header.contact.email,
    ...(resume.header.contact.links || []),
  ]
    .filter(Boolean)
    .join(" | ");
  text += `${contactInfo}\n\n`;

  // Summary
  text += `PROFESSIONAL SUMMARY\n\n${resume.summary}\n\n`;

  // Skills
  text += `SKILLS\n\n${resume.skills.join(", ")}\n\n`;

  // Experience
  text += `WORK EXPERIENCE\n\n`;
  resume.experience.forEach((exp) => {
    text += `${exp.title} | ${exp.company} | ${exp.startDate} - ${exp.endDate}\n`;
    if (exp.location) text += `${exp.location}\n`;
    exp.achievements.forEach((achievement) => {
      text += `● ${achievement}\n`;
    });
    text += "\n";
  });

  // Projects (if any)
  if (resume.projects && resume.projects.length > 0) {
    text += `PROJECTS\n\n`;
    resume.projects.forEach((project) => {
      const dateRange =
        project.startDate && project.endDate
          ? `| ${project.startDate} - ${project.endDate}`
          : "";
      text += `${project.name} ${dateRange}\n`;
      project.description.forEach((desc) => {
        text += `● ${desc}\n`;
      });
      text += "\n";
    });
  }

  // Education
  text += `EDUCATION\n\n`;
  resume.education.forEach((edu) => {
    text += `${edu.degree} in ${edu.field} | ${edu.institution} | ${edu.graduationDate}\n`;
    if (edu.location) text += `${edu.location}\n`;
    if (edu.details && edu.details.length > 0) {
      text += edu.details.join(", ") + "\n";
    }
    text += "\n";
  });

  // Certifications (if any)
  if (resume.certifications && resume.certifications.length > 0) {
    text += `CERTIFICATIONS\n\n`;
    resume.certifications.forEach((cert) => {
      text += `${cert.name} | ${cert.issuer} | ${cert.date}\n`;
      if (cert.details) text += `${cert.details}\n`;
      text += "\n";
    });
  }

  return text.trim();
}
