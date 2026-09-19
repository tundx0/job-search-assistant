import { NextResponse } from "next/server";
import path from "path";
import { getCurrentUser } from "@/lib/auth/session";
import { retrieveFileBytes } from "@/lib/storage";
import {
  getContentTypeForFile,
  parseStorageBucketParam,
  parseStorageProviderParam,
  resolveOwnedStorageKey,
} from "@/lib/storage/paths";

function isNotFoundError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /not found|NoSuchKey|NotFound/i.test(message);
}

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

    const providerParam = searchParams.get("provider");
    const provider = parseStorageProviderParam(providerParam);
    if (providerParam && !provider) {
      return NextResponse.json({ message: "Invalid provider" }, { status: 400 });
    }

    const bucketParam = searchParams.get("bucket");
    const bucket = parseStorageBucketParam(bucketParam);
    if (bucketParam && bucket == null) {
      return NextResponse.json({ message: "Invalid bucket" }, { status: 400 });
    }

    let body: Buffer;
    try {
      body = await retrieveFileBytes(fileKey, {
        provider,
        bucket: bucket || undefined,
      });
    } catch (error) {
      if (isNotFoundError(error)) {
        return NextResponse.json({ message: "File not found" }, { status: 404 });
      }
      console.error("Error reading file:", error);
      return NextResponse.json(
        { message: "Failed to read file" },
        { status: 500 }
      );
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
