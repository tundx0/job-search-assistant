import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import fs from "fs";
import path from "path";

/**
 * API endpoint to list files in storage
 *
 * Query parameters:
 * - type: Filter by file type (e.g., 'document', 'resume', 'coverLetter')
 */
export async function GET(request: Request) {
  try {
    const session = await getCurrentUser();

    if (!session || !session.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    // Define the storage directory
    const storageDir = path.join(process.cwd(), "storage");

    // Ensure the directory exists
    if (!fs.existsSync(storageDir)) {
      return NextResponse.json({ files: [] });
    }

    // Read all files in the directory
    const files = fs.readdirSync(storageDir);

    // Filter files based on type if specified
    let filteredFiles = files;
    if (type) {
      if (type === "document") {
        filteredFiles = files.filter(
          (file) =>
            file.endsWith(".txt") ||
            file.endsWith(".json") ||
            file.endsWith(".md")
        );
      } else if (type === "resume") {
        filteredFiles = files.filter((file) => file.includes("resume"));
      } else if (type === "coverLetter") {
        filteredFiles = files.filter((file) => file.includes("cover-letter"));
      }
    }

    // Return the list of files
    return NextResponse.json({ files: filteredFiles });
  } catch (error) {
    console.error("Error listing files:", error);
    return NextResponse.json(
      { message: "Failed to list files", error: String(error) },
      { status: 500 }
    );
  }
}
