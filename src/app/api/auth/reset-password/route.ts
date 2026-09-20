import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hash } from "bcrypt";
import { isAfter } from "date-fns";
import { hashResetToken } from "@/lib/auth/reset-token";

export async function POST(request: Request) {
  try {
    const { token, email, password } = await request.json();

    if (!token || !email || !password) {
      return NextResponse.json(
        { message: "Token, email, and password are required" },
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

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const hashedPassword = await hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashedPassword },
    });

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
      { message: "Failed to reset password" },
      { status: 500 }
    );
  }
}
