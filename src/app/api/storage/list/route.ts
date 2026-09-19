import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getStorageRoot,
  getUserStoragePrefix,
  resolveStorageFsPath,
} from "@/lib/storage/paths";

export async function GET(request: Request) {
  try {
    const session = await getCurrentUser();

    if (!session || !session.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    const storageRoot = getStorageRoot();
    const userPrefix = getUserStoragePrefix(session.id);
    const userDir = resolveStorageFsPath(storageRoot, userPrefix);

    if (!userDir || !fs.existsSync(userDir) || !fs.statSync(userDir).isDirectory()) {
      return NextResponse.json({ files: [] });
    }

    const files = fs
      .readdirSync(userDir)
      .filter((file) => {
        const fullPath = path.join(userDir, file);
        return fs.statSync(fullPath).isFile();
      });

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

    return NextResponse.json({ files: filteredFiles });
  } catch (error) {
    console.error("Error listing files:", error);
    return NextResponse.json(
      { message: "Failed to list files" },
      { status: 500 }
    );
  }
}
