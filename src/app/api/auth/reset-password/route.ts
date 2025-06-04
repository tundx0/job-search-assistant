import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hash } from "bcrypt";
import { isAfter } from "date-fns";

export async function POST(request: Request) {
  try {
    const { token, email, password } = await request.json();

    if (!token || !email || !password) {
      return NextResponse.json(
        { error: "Token, email, and password are required" },
        { status: 400 }
      );
    }

    // Find the password reset record
    const passwordReset = await prisma.passwordReset.findFirst({
      where: {
        token,
        email,
      },
    });

    // Check if the token exists and is valid
    if (!passwordReset) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Check if the token has expired
    if (isAfter(new Date(), new Date(passwordReset.expires))) {
      // Delete the expired token
      await prisma.passwordReset.delete({
        where: { id: passwordReset.id },
      });
      
      return NextResponse.json(
        { error: "Reset token has expired" },
        { status: 400 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Hash the new password
    const hashedPassword = await hash(password, 10);

    // Update the user's password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashedPassword },
    });

    // Delete the used token
    await prisma.passwordReset.delete({
      where: { id: passwordReset.id },
    });

    return NextResponse.json(
      { success: true, message: "Password reset successful" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
