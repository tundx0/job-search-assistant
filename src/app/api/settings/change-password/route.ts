import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";

// POST /api/settings/change-password - Change the current user's password
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { currentPassword, newPassword } = await req.json();
    
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: "Current password and new password are required" },
        { status: 400 }
      );
    }
    
    // Validate new password
    if (newPassword.length < 8) {
      return NextResponse.json(
        { message: "New password must be at least 8 characters long" },
        { status: 400 }
      );
    }
    
    // Get the user with password hash
    const userWithPassword = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    });
    
    if (!userWithPassword) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }
    
    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      userWithPassword.passwordHash
    );
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Current password is incorrect" },
        { status: 400 }
      );
    }
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the user's password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashedPassword },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error changing password:", error);
    return NextResponse.json(
      { message: "Failed to change password" },
      { status: 500 }
    );
  }
}
