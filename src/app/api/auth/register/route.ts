import { NextResponse } from "next/server";
import { hash } from "bcrypt";
import { prisma } from "@/lib/db/prisma";
import * as z from "zod";

// Define schema for validation
const registerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate input data
    const { name, email, password } = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash the password
    const hashedPassword = await hash(password, 10);

    // Create the user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        experience: {}, // Empty JSON object for experience
        education: {}, // Empty JSON object for education
        skills: [], // Empty array for skills
      },
    });

    // Return the user without the password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        message: "User registered successfully",
        user: userWithoutPassword,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);

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
