import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { isAfter } from "date-fns";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email) {
      return NextResponse.json(
        { error: "Token and email are required" },
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

    return NextResponse.json(
      { valid: true },
      { status: 200 }
    );
  } catch (error) {
    console.error("Token verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify reset token" },
      { status: 500 }
    );
  }
}
