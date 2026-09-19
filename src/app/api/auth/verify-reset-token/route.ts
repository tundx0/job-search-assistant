import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { isAfter } from "date-fns";
import { hashResetToken } from "@/lib/auth/reset-token";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email) {
      return NextResponse.json(
        { message: "Token and email are required" },
        { status: 400 }
      );
    }

    const tokenHash = hashResetToken(token);

    const passwordReset = await prisma.passwordReset.findFirst({
      where: {
        token: tokenHash,
        email,
      },
    });

    if (!passwordReset) {
      return NextResponse.json(
        { message: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    if (isAfter(new Date(), new Date(passwordReset.expires))) {
      await prisma.passwordReset.delete({
        where: { id: passwordReset.id },
      });

      return NextResponse.json(
        { message: "Reset token has expired" },
        { status: 400 }
      );
    }

    return NextResponse.json({ valid: true }, { status: 200 });
  } catch (error) {
    console.error("Token verification error:", error);
    return NextResponse.json(
      { message: "Failed to verify reset token" },
      { status: 500 }
    );
  }
}
