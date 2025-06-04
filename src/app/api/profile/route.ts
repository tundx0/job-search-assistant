import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import * as z from "zod";

// Define the experience item schema
const experienceItemSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  company: z.string(),
  location: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  current: z.boolean().optional(),
  description: z.string(),
});

// Define the education item schema
const educationItemSchema = z.object({
  id: z.string().optional(),
  degree: z.string(),
  institution: z.string(),
  location: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  current: z.boolean().optional(),
  description: z.string().optional(),
});

// Define the project item schema
const projectItemSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  current: z.boolean().optional(),
  description: z.array(z.string()),
});

const profileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  bio: z.string().optional(),
  location: z.string().optional(),
  phone: z.string().optional(),
  linkedin: z.string().optional(),
  github: z.string().optional(),
  website: z.string().optional(),
  skills: z.array(z.string()),
  // Accept either an array of experience items or an object that can be converted to an array
  experience: z.union([
    z.array(experienceItemSchema),
    z.record(experienceItemSchema).transform((obj) => Object.values(obj)),
  ]),
  // Accept either an array of education items or an object that can be converted to an array
  education: z.union([
    z.array(educationItemSchema),
    z.record(educationItemSchema).transform((obj) => Object.values(obj)),
  ]),
  // Accept either an array of project items or an object that can be converted to an array
  projects: z
    .union([
      z.array(projectItemSchema),
      z.record(projectItemSchema).transform((obj) => Object.values(obj)),
    ])
    .optional(),
});

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userProfile = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
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

    if (!userProfile) {
      return NextResponse.json(
        { message: "User profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(userProfile);
  } catch (error) {
    console.error("Profile fetch error:", error);

    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const validatedData = profileSchema.parse(body);

    const updatedProfile = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        name: validatedData.name,
        bio: validatedData.bio || null,
        location: validatedData.location || null,
        phone: validatedData.phone || null,
        linkedin: validatedData.linkedin || null,
        github: validatedData.github || null,
        website: validatedData.website || null,
        experience: validatedData.experience,
        education: validatedData.education,
        projects: validatedData.projects,
        skills: validatedData.skills,
      },
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

    return NextResponse.json({
      message: "Profile updated successfully",
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("Profile update error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid input data", errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
