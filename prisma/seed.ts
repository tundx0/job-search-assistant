import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const LOCAL_DEV_ADMIN_PASSWORD = "local-dev-admin-ChangeMe!";

async function main() {
  try {
    if (process.env.NODE_ENV === "production" && !process.env.ADMIN_PASSWORD) {
      throw new Error(
        "ADMIN_PASSWORD must be set when seeding in production. See .env.example."
      );
    }

    const adminPassword =
      process.env.ADMIN_PASSWORD || LOCAL_DEV_ADMIN_PASSWORD;
    const passwordHash = await hash(adminPassword, 12);

    const defaultExperience = JSON.stringify([
      {
        company: "Job Assistant",
        position: "Administrator",
        startDate: "2023-01-01",
        endDate: null,
        description: "System administrator for the Job Assistant application.",
      },
    ]);

    const defaultEducation = JSON.stringify([
      {
        institution: "Admin University",
        degree: "System Administration",
        field: "Computer Science",
        startDate: "2018-01-01",
        endDate: "2022-01-01",
      },
    ]);

    const admin = await prisma.user.upsert({
      where: { email: "admin@jobassistant.com" },
      update: {
        role: "ADMIN",
        passwordHash,
      },
      create: {
        email: "admin@jobassistant.com",
        name: "Admin User",
        role: "ADMIN",
        passwordHash,
        experience: defaultExperience,
        education: defaultEducation,
        skills: ["Administration", "System Management", "User Support"],
      },
    });

    console.log(`Admin user created/updated: ${admin.name} (${admin.email})`);
    if (process.env.ADMIN_PASSWORD) {
      console.log("Password: value from ADMIN_PASSWORD");
    } else {
      console.log(
        "Password: documented local-dev default from .env.example (ADMIN_PASSWORD / local-dev-admin-ChangeMe!). Change it before any shared environment."
      );
    }
    console.log("You can now log in with these credentials to access the admin panel.");
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
