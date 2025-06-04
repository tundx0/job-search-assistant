// Extend the Next Auth User type
declare module "next-auth" {
  interface User {
    id: string;
    name: string;
    email: string;
    bio?: string;
    skills?: string[];
    role?: string;
  }

  interface Session {
    user: User;
  }
}

// Resume Insight Types
export interface ResumeInsight {
  overallFeedback: string;
  improvementAreas: string[];
  strengths: string[];
  missingKeywords: string[];
  skillGaps: string[];
  formatSuggestions?: string | null;
  contentSuggestions?: string | null;
  summaryFeedback?: string | null;
  experienceFeedback?: string | null;
  educationFeedback?: string | null;
  skillsFeedback?: string | null;
}

// Job Application Types
export interface JobApplication {
  id: string;
  userId: string;
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  tailoredResume: string;
  coverLetter: string;
  tailoredResumePdf?: string;
  coverLetterPdf?: string;
  tailoredResumeJSON?: string;
  strengthScore?: number; // Score from 0-100 indicating resume match strength
  status: JobApplicationStatus;
  createdAt: string;
  updatedAt: string;
  resumeInsight?: ResumeInsight | null;
  jobUrl?: string; // URL to the original job posting
}

export type JobApplicationStatus =
  | "pending"
  | "submitted"
  | "interviewing"
  | "rejected"
  | "accepted";

// Experience and Education Types
export interface WorkExperience {
  title: string;
  company: string;
  startDate: string;
  endDate?: string;
  description: string;
  current?: boolean;
}

export interface Education {
  degree: string;
  institution: string;
  startDate: string;
  endDate?: string;
  description?: string;
  current?: boolean;
}

export interface Project {
  name: string;
  startDate: string;
  endDate?: string;
  description: string;
}

// User Profile Type
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  bio?: string;
  experience: WorkExperience[];
  education: Education[];
  projects: Project[];
  skills: string[];
}

// Form Types
export interface LoginFormValues {
  email: string;
  password: string;
}

export interface RegisterFormValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ProfileFormValues {
  name: string;
  bio: string;
  skills: string;
  experience: string;
  education: string;
  projects: string;
}

export interface JobSubmissionFormValues {
  jobTitle: string;
  companyName: string;
  jobDescription: string;
}
