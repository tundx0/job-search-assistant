import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getCurrentUser } from "@/lib/auth/session";
import {
  retrieveFileBytes,
} from "@/lib/storage";
import {
  getContentTypeForFile,
  getStorageRoot,
  resolveOwnedStorageKey,
  resolveStorageFsPath,
} from "@/lib/storage/paths";

export async function GET(request: Request) {
  try {
    const session = await getCurrentUser();

    if (!session || !session.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get("name");

    if (!fileName) {
      return NextResponse.json(
        { message: "File name is required" },
        { status: 400 }
      );
    }

    const allowAdmin = session.role === "ADMIN";
    const fileKey = resolveOwnedStorageKey(fileName, session.id, {
      allowAdmin,
    });

    if (!fileKey) {
      return NextResponse.json({ message: "Invalid file path" }, { status: 400 });
    }

    const storageRoot = getStorageRoot();
    const fsPath = resolveStorageFsPath(storageRoot, fileKey);
    if (!fsPath) {
      return NextResponse.json({ message: "Invalid file path" }, { status: 400 });
    }

    let body: Buffer;
    try {
      body = await retrieveFileBytes(fileKey);
    } catch {
      if (!fs.existsSync(fsPath) || !fs.statSync(fsPath).isFile()) {
        return NextResponse.json({ message: "File not found" }, { status: 404 });
      }
      return NextResponse.json({ message: "File not found" }, { status: 404 });
    }

    const contentType = getContentTypeForFile(fileKey);
    const download = searchParams.get("download") === "1";
    const filename = path.basename(fileKey);

    return new NextResponse(new Uint8Array(body), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Error reading file:", error);
    return NextResponse.json(
      { message: "Failed to read file" },
      { status: 500 }
    );
  }
}
