import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { randomBytes } from "crypto";
import { addHours } from "date-fns";

// In a real application, you would use a proper email sending service
// like SendGrid, Mailgun, AWS SES, etc.
async function sendPasswordResetEmail(email: string, resetLink: string) {
  console.log(`Sending password reset email to ${email}`);
  console.log(`Reset link: ${resetLink}`);
  
  // In development, we'll just log the reset link
  // In production, you would use something like:
  // await sendgrid.send({
  //   to: email,
  //   from: 'noreply@yourapp.com',
  //   subject: 'Reset your password',
  //   text: `Click the link to reset your password: ${resetLink}`,
  //   html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
  // });
  
  return true;
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // For security reasons, don't reveal if the email exists or not
    // Just proceed as if the email was sent
    if (!user) {
      return NextResponse.json(
        { success: true, message: "If an account with that email exists, we've sent password reset instructions." },
        { status: 200 }
      );
    }

    // Generate a secure random token
    const token = randomBytes(32).toString("hex");
    
    // Set expiration to 1 hour from now
    const expires = addHours(new Date(), 1);

    // Delete any existing reset tokens for this user
    await prisma.passwordReset.deleteMany({
      where: { email },
    });

    // Create a new password reset token
    await prisma.passwordReset.create({
      data: {
        email,
        token,
        expires,
      },
    });

    // Create the reset link
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetLink = `${baseUrl}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    // Send the email
    await sendPasswordResetEmail(email, resetLink);

    return NextResponse.json(
      { success: true, message: "If an account with that email exists, we've sent password reset instructions." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password reset request error:", error);
    return NextResponse.json(
      { error: "Failed to process password reset request" },
      { status: 500 }
    );
  }
}
