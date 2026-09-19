import fs from "fs";
import path from "path";
import { IStorageProvider, StorageOptions, FileInfo } from "./types";
import {
  getAuthenticatedFileUrl,
  getContentTypeForFile,
  getStorageRoot,
  resolveStorageFsPath,
  sanitizeStorageKey,
} from "./paths";

/**
 * Local File System Storage Provider
 * For development and testing purposes
 */
export class LocalStorageProvider implements IStorageProvider {
  private storagePath: string;

  constructor() {
    this.storagePath = getStorageRoot();

    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }
  }

  private resolvePath(fileKey: string): string {
    const resolved = resolveStorageFsPath(this.storagePath, fileKey);
    if (!resolved) {
      throw new Error("Invalid file path");
    }
    return resolved;
  }

  /**
   * Upload a file to the local file system
   */
  async uploadFile(
    content: string | Buffer,
    fileName: string,
    options?: StorageOptions
  ): Promise<FileInfo> {
    const safeFileName = path.basename(fileName);
    const sanitizedName = sanitizeStorageKey(safeFileName);
    if (!sanitizedName) {
      throw new Error("Invalid file name");
    }

    let folderKey = "";
    if (options?.path) {
      const sanitizedPath = sanitizeStorageKey(options.path);
      if (!sanitizedPath) {
        throw new Error("Invalid storage path");
      }
      folderKey = sanitizedPath;
    }

    const fileKey = folderKey
      ? `${folderKey}/${sanitizedName}`
      : sanitizedName;
    const filePath = this.resolvePath(fileKey);
    const folderPath = path.dirname(filePath);

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const buffer = typeof content === "string" ? Buffer.from(content) : content;
    const contentType = options?.contentType || getContentTypeForFile(sanitizedName);

    try {
      fs.writeFileSync(filePath, buffer);
      const stats = fs.statSync(filePath);

      return {
        url: getAuthenticatedFileUrl(fileKey, { provider: "local" }),
        key: fileKey,
        size: stats.size,
        contentType,
        lastModified: stats.mtime,
        provider: "local",
      };
    } catch (error) {
      console.error("Error uploading file to local storage:", error);
      throw new Error(
        `Failed to upload file to local storage: ${(error as Error).message}`
      );
    }
  }

  /**
   * Download a file from the local file system as UTF-8 text
   */
  async downloadFile(fileKey: string): Promise<string> {
    const buffer = await this.downloadFileBuffer(fileKey);
    return buffer.toString("utf-8");
  }

  async downloadFileBuffer(fileKey: string): Promise<Buffer> {
    const filePath = this.resolvePath(fileKey);

    try {
      if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        throw new Error(`File not found: ${fileKey}`);
      }

      return fs.readFileSync(filePath);
    } catch (error) {
      console.error("Error downloading file from local storage:", error);
      throw new Error(
        `Failed to download file from local storage: ${
          (error as Error).message
        }`
      );
    }
  }

  /**
   * Delete a file from the local file system
   */
  async deleteFile(fileKey: string): Promise<boolean> {
    const filePath = this.resolvePath(fileKey);

    try {
      if (!fs.existsSync(filePath)) {
        return true;
      }

      fs.unlinkSync(filePath);
      return true;
    } catch (error) {
      console.error("Error deleting file from local storage:", error);
      throw new Error(
        `Failed to delete file from local storage: ${(error as Error).message}`
      );
    }
  }

  /**
   * Generate a signed URL for temporary access to a file
   */
  async getSignedUrl(fileKey: string): Promise<string> {
    this.resolvePath(fileKey);
    return getAuthenticatedFileUrl(fileKey, { provider: "local" });
  }

  /**
   * Get a direct URL for a file. Local files are served through the
   * authenticated API route, not a public static path.
   */
  async getDirectUrl(fileKey: string): Promise<string> {
    return this.getSignedUrl(fileKey);
  }
}
