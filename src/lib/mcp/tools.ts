import { prisma } from "@/lib/db/prisma";
import { generateCoverLetter } from "@/lib/ai/generation";
import {
  generateResumeJSON,
  convertResumeJSONToText,
} from "@/lib/ai/simple-json-generation";
import { calculateResumeStrengthWithAI } from "@/lib/ai/resume-scoring";
import { z } from "zod";

import { headers } from "next/headers";

// Helper to get the user for MCP operations
export async function getMcpUser() {
  const reqHeaders = await headers();
  const authHeader = reqHeaders.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer mcp_")) {
    return null;
  }

  const token = authHeader.replace("Bearer ", "");
  const parts = token.split("_");
  if (parts.length < 3) return null;

  const userId = parts[1];
  return await prisma.user.findUnique({ where: { id: userId } });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerMcpTools(server: any) {
  server.registerTool(
    "get_profile",
    {
      title: "Get Profile",
      description:
        "Get the current user's profile details including skills, experience, and education.",
      inputSchema: z.object({}),
    },
    async () => {
      const user = await getMcpUser();
      if (!user) throw new Error("No user found in the database");

      const profile = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          name: true,
          bio: true,
          location: true,
          phone: true,
          linkedin: true,
          github: true,
          website: true,
          experience: true,
          education: true,
          projects: true,
          skills: true,
        },
      });

      return {
        content: [{ type: "text", text: JSON.stringify(profile, null, 2) }],
      };
    },
  );

  server.registerTool(
    "update_profile",
    {
      title: "Update Profile",
      description:
        "Update the user's profile details (skills, bio, name, etc.).",
      inputSchema: z.object({
        name: z.string().optional(),
        bio: z.string().optional(),
        skills: z.array(z.string()).optional(),
        location: z.string().optional(),
      }),
    },
    async (args: {
      name?: string;
      bio?: string;
      skills?: string[];
      location?: string;
    }) => {
      const user = await getMcpUser();
      if (!user) throw new Error("No user found");

      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(args.name && { name: args.name }),
          ...(args.bio !== undefined && { bio: args.bio }),
          ...(args.skills && { skills: args.skills }),
          ...(args.location !== undefined && { location: args.location }),
        },
        select: { name: true, bio: true, skills: true, location: true },
      });

      return {
        content: [
          {
            type: "text",
            text: `Profile updated successfully: ${JSON.stringify(updated)}`,
          },
        ],
      };
    },
  );

  server.registerTool(
    "create_job_application",
    {
      title: "Create Job Application",
      description: "Create a new job application tracking entry.",
      inputSchema: z.object({
        jobTitle: z.string(),
        companyName: z.string(),
        jobDescription: z.string(),
      }),
    },
    async (args: {
      jobTitle: string;
      companyName: string;
      jobDescription: string;
    }) => {
      const user = await getMcpUser();
      if (!user) throw new Error("No user found");

      const jobApp = await prisma.jobApplication.create({
        data: {
          jobTitle: args.jobTitle,
          companyName: args.companyName,
          jobDescription: args.jobDescription,
          status: "pending",
          userId: user.id,
          tailoredResume: "",
          coverLetter: "",
        },
      });

      return {
        content: [
          { type: "text", text: `Job application created. ID: ${jobApp.id}` },
        ],
      };
    },
  );

  server.registerTool(
    "get_job_application",
    {
      title: "Get Job Application Details",
      description:
        "Get details, documents, and scores for a specific job application.",
      inputSchema: z.object({
        jobId: z.string().uuid(),
      }),
    },
    async ({ jobId }: { jobId: string }) => {
      const user = await getMcpUser();
      if (!user) throw new Error("No user found");

      const app = await prisma.jobApplication.findUnique({
        where: { id: jobId },
      });

      if (!app || app.userId !== user.id) {
        throw new Error("Job application not found");
      }

      return {
        content: [{ type: "text", text: JSON.stringify(app, null, 2) }],
      };
    },
  );

  server.registerTool(
    "list_job_applications",
    {
      title: "List Job Applications",
      description: "List all job applications for the user.",
      inputSchema: z.object({}),
    },
    async () => {
      const user = await getMcpUser();
      if (!user) throw new Error("No user found");

      const apps = await prisma.jobApplication.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          jobTitle: true,
          companyName: true,
          status: true,
          strengthScore: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      return {
        content: [{ type: "text", text: JSON.stringify(apps, null, 2) }],
      };
    },
  );

  server.registerTool(
    "generate_documents",
    {
      title: "Generate Documents for Job Application",
      description:
        "Trigger the AI to generate a tailored resume, cover letter, and strength score for a job application.",
      inputSchema: z.object({
        jobId: z.string().uuid(),
      }),
    },
    async ({ jobId }: { jobId: string }) => {
      const user = await getMcpUser();
      if (!user) throw new Error("No user found");

      const app = await prisma.jobApplication.findUnique({
        where: { id: jobId },
      });
      if (!app || app.userId !== user.id) {
        throw new Error("Job application not found");
      }

      const resumeJSON = await generateResumeJSON(
        user.id,
        app.jobDescription,
        app.jobTitle,
        app.companyName,
        { email: user.email }, // Simplification
        user.atsOptimizationEnabled ?? undefined,
      );

      const resume = convertResumeJSONToText(resumeJSON);
      const coverLetter = await generateCoverLetter(
        user.id,
        app.jobDescription,
        app.jobTitle,
        app.companyName,
      );

      const insights = await calculateResumeStrengthWithAI(
        resumeJSON,
        app.jobDescription,
        app.jobTitle,
        user.id,
      );

      await prisma.jobApplication.update({
        where: { id: jobId },
        data: {
          tailoredResume: resume,
          coverLetter: coverLetter,
          status: "submitted",
          strengthScore: insights.score,
        },
      });

      return {
        content: [
          {
            type: "text",
            text: `Documents generated successfully! Strength Score: ${insights.score}\n\nCover Letter Preview:\n${coverLetter.substring(0, 200)}...`,
          },
        ],
      };
    },
  );
}
