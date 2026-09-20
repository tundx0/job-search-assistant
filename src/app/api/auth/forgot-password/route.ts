import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { addHours } from "date-fns";
import {
  generateResetToken,
  hashResetToken,
  isDevPasswordResetEnabled,
} from "@/lib/auth/reset-token";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    const allowDevReset = isDevPasswordResetEnabled();
    if (!allowDevReset) {
      return NextResponse.json(
        {
          message:
            "Password reset email is not configured. In development, set ALLOW_DEV_PASSWORD_RESET=true to receive a reset link in the response.",
        },
        { status: 503 }
      );
    }

    const genericSuccess = {
      success: true,
      message:
        "If an account with that email exists, password reset instructions are available.",
      delivery: "dev" as const,
    };

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(genericSuccess, { status: 200 });
    }

    const token = generateResetToken();
    const tokenHash = hashResetToken(token);
    const expires = addHours(new Date(), 1);

    await prisma.passwordReset.deleteMany({
      where: { email },
    });

    await prisma.passwordReset.create({
      data: {
        email,
        token: tokenHash,
        expires,
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetLink = `${baseUrl}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    return NextResponse.json(
      {
        ...genericSuccess,
        resetLink,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password reset request error:", error);
    return NextResponse.json(
      { message: "Failed to process password reset request" },
      { status: 500 }
    );
  }
}
