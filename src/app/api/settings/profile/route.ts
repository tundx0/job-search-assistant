import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

// PUT /api/settings/profile - Update the current user's profile
export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const {
      name,
      bio,
      location,
      phone,
      linkedin,
      github,
      website,
    } = await req.json();
    
    // Name is required
    if (!name || name.trim() === "") {
      return NextResponse.json(
        { message: "Name is required" },
        { status: 400 }
      );
    }
    
    // Update the user profile
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        bio,
        location,
        phone,
        linkedin,
        github,
        website,
      },
    });
    
    return NextResponse.json({
      success: true,
      user: {
        name: updatedUser.name,
        bio: updatedUser.bio,
        location: updatedUser.location,
        phone: updatedUser.phone,
        linkedin: updatedUser.linkedin,
        github: updatedUser.github,
        website: updatedUser.website,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { message: "Failed to update profile" },
      { status: 500 }
    );
  }
}
