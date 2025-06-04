import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import * as z from "zod";

// Schema for validating the request body
const atsOptimizationSchema = z.object({
  atsOptimizationEnabled: z.boolean(),
});

// GET /api/settings/ats-optimization - Get the current user's ATS optimization preference
export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get the user's current ATS optimization setting
    const userPreference = await prisma.user.findUnique({
      where: { id: user.id },
      select: { atsOptimizationEnabled: true }
    });
    
    return NextResponse.json({
      enabled: userPreference?.atsOptimizationEnabled || false,
    });
  } catch (error) {
    console.error("Error fetching ATS optimization setting:", error);
    return NextResponse.json(
      { message: "Failed to fetch ATS optimization setting" },
      { status: 500 }
    );
  }
}

// POST /api/settings/ats-optimization - Update the current user's ATS optimization preference
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Validate the request body
    const body = await req.json();
    const { atsOptimizationEnabled } = atsOptimizationSchema.parse(body);
    
    // Update the user's ATS optimization setting
    await prisma.user.update({
      where: { id: user.id },
      data: { atsOptimizationEnabled }
    });
    
    return NextResponse.json({
      message: "ATS optimization setting updated successfully",
      atsOptimizationEnabled
    });
  } catch (error) {
    console.error("Error updating ATS optimization setting:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid input data", errors: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: "Failed to update ATS optimization setting" },
      { status: 500 }
    );
  }
}
