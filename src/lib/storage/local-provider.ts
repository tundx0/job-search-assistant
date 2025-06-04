import fs from "fs";
import path from "path";
import { IStorageProvider, StorageOptions, FileInfo } from "./types";

/**
 * Local File System Storage Provider
 * For development and testing purposes
 */
export class LocalStorageProvider implements IStorageProvider {
  private storagePath: string;

  constructor() {
    this.storagePath =
      process.env.LOCAL_STORAGE_PATH || path.join(process.cwd(), "storage");

    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }
  }

  /**
   * Upload a file to the local file system
   */
  async uploadFile(
    content: string | Buffer,
    fileName: string,
    options?: StorageOptions
  ): Promise<FileInfo> {
    const folderPath = options?.path
      ? path.join(this.storagePath, options.path)
      : this.storagePath;

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const filePath = path.join(folderPath, fileName);
    const fileKey = options?.path ? `${options.path}/${fileName}` : fileName;

    const buffer = typeof content === "string" ? Buffer.from(content) : content;

    const contentType = options?.contentType || this.getContentType(fileName);

    try {
      fs.writeFileSync(filePath, buffer);

      const stats = fs.statSync(filePath);

      // Generate a URL (for local development, this is just a file path)
      const baseUrl =
        process.env.LOCAL_STORAGE_URL || `file://${this.storagePath}`;
      const url = `${baseUrl}/${fileKey}`;

      return {
        url,
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
   * Download a file from the local file system
   */
  async downloadFile(fileKey: string): Promise<string> {
    const filePath = path.join(this.storagePath, fileKey);

    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${fileKey}`);
      }

      return fs.readFileSync(filePath, "utf-8");
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
    const filePath = path.join(this.storagePath, fileKey);

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
   * For local storage, this just returns the file path
   */
  async getSignedUrl(fileKey: string): Promise<string> {
    const filePath = path.join(this.storagePath, fileKey);

    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${fileKey}`);
      }

      const baseUrl =
        process.env.LOCAL_STORAGE_URL || `file://${this.storagePath}`;
      return `${baseUrl}/${fileKey}`;
    } catch (error) {
      console.error("Error generating URL for local storage:", error);
      throw new Error(
        `Failed to generate URL for local storage: ${(error as Error).message}`
      );
    }
  }

  /**
   * Get a direct URL for a file (no signing, for public files)
   * For local storage, this is the same as getSignedUrl
   */
  async getDirectUrl(fileKey: string): Promise<string> {
    return this.getSignedUrl(fileKey);
  }

  /**
   * Helper method to determine content type from file name
   */
  private getContentType(fileName: string): string {
    const extension = fileName.split(".").pop()?.toLowerCase();

    const mimeTypes: Record<string, string> = {
      txt: "text/plain",
      html: "text/html",
      css: "text/css",
      js: "application/javascript",
      json: "application/json",
      pdf: "application/pdf",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      svg: "image/svg+xml",
      webp: "image/webp",
      mp4: "video/mp4",
      mp3: "audio/mpeg",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    };

    return extension && mimeTypes[extension]
      ? mimeTypes[extension]
      : "application/octet-stream";
  }
}
