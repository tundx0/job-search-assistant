import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import fs from "fs";
import path from "path";

/**
 * API endpoint to get file content from storage
 *
 * Query parameters:
 * - name: Name of the file to retrieve
 */
export async function GET(request: Request) {
  try {
    const session = await getCurrentUser();

    if (!session || !session.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get("name");

    if (!fileName) {
      return NextResponse.json(
        { message: "File name is required" },
        { status: 400 }
      );
    }

    // Define the file path
    const filePath = path.join(process.cwd(), "storage", fileName);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ message: "File not found" }, { status: 404 });
    }

    // Read file content
    const content = fs.readFileSync(filePath, "utf-8");

    // Determine content type based on file extension
    const extension = path.extname(fileName).toLowerCase();
    let contentType = "text/plain";

    if (extension === ".json") {
      contentType = "application/json";
    } else if (extension === ".md") {
      contentType = "text/markdown";
    }

    // Return the file content
    return NextResponse.json({
      content,
      contentType,
      fileName,
    });
  } catch (error) {
    console.error("Error reading file:", error);
    return NextResponse.json(
      { message: "Failed to read file", error: String(error) },
      { status: 500 }
    );
  }
}
