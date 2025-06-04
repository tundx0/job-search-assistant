import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { IStorageProvider, StorageOptions, FileInfo } from "./types";

/**
 * AWS S3 Storage Provider
 */
export class AwsStorageProvider implements IStorageProvider {
  private client: S3Client;
  private defaultBucket: string;

  constructor() {
    const region = process.env.AWS_REGION || "us-east-1";
    this.defaultBucket = process.env.AWS_S3_BUCKET || "";

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.warn(
        "AWS credentials not found. S3 storage will not work properly."
      );
    }

    this.client = new S3Client({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });
  }

  /**
   * Upload a file to AWS S3
   */
  async uploadFile(
    content: string | Buffer,
    fileName: string,
    options?: StorageOptions
  ): Promise<FileInfo> {
    const bucket = options?.bucket || this.defaultBucket;
    const path = options?.path ? `${options.path}/` : "";
    const key = `${path}${fileName}`;

    const buffer = typeof content === "string" ? Buffer.from(content) : content;

    const contentType = options?.contentType || this.getContentType(fileName);

    const cacheControl = `max-age=${options?.cacheControl || 3600}`;

    // Set up ACL (public or private)
    const acl = options?.public ? "public-read" : "private";

    try {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: cacheControl,
        ACL: acl,
        Metadata: options?.metadata,
      });

      await this.client.send(command);

      const url = options?.public
        ? `https://${bucket}.s3.amazonaws.com/${key}`
        : await this.getSignedUrl(key, 3600, options);

      return {
        url,
        key,
        size: buffer.length,
        contentType,
        lastModified: new Date(),
        provider: "aws",
      };
    } catch (error) {
      console.error("Error uploading file to AWS S3:", error);
      throw new Error(
        `Failed to upload file to AWS S3: ${(error as Error).message}`
      );
    }
  }

  /**
   * Download a file from AWS S3
   */
  async downloadFile(
    fileKey: string,
    options?: StorageOptions
  ): Promise<string> {
    const bucket = options?.bucket || this.defaultBucket;

    try {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: fileKey,
      });

      const response = await this.client.send(command);

      if (!response.Body) {
        throw new Error("File body is empty");
      }

      if (response.Body instanceof Blob) {
        return await response.Body.text();
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const streamToString = (stream: any): Promise<string> => {
          return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];
            stream.on("data", (chunk: Buffer) => chunks.push(chunk));
            stream.on("error", reject);
            stream.on("end", () =>
              resolve(Buffer.concat(chunks).toString("utf-8"))
            );
          });
        };

        return await streamToString(response.Body);
      }
    } catch (error) {
      console.error("Error downloading file from AWS S3:", error);
      throw new Error(
        `Failed to download file from AWS S3: ${(error as Error).message}`
      );
    }
  }

  /**
   * Delete a file from AWS S3
   */
  async deleteFile(
    fileKey: string,
    options?: StorageOptions
  ): Promise<boolean> {
    const bucket = options?.bucket || this.defaultBucket;

    try {
      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: fileKey,
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      console.error("Error deleting file from AWS S3:", error);
      throw new Error(
        `Failed to delete file from AWS S3: ${(error as Error).message}`
      );
    }
  }

  /**
   * Generate a signed URL for temporary access to a file
   */
  async getSignedUrl(
    fileKey: string,
    expiresIn: number = 3600,
    options?: StorageOptions
  ): Promise<string> {
    const bucket = options?.bucket || this.defaultBucket;

    try {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: fileKey,
      });

      return await getSignedUrl(this.client, command, { expiresIn });
    } catch (error) {
      console.error("Error generating signed URL for AWS S3:", error);
      throw new Error(
        `Failed to generate signed URL for AWS S3: ${(error as Error).message}`
      );
    }
  }

  /**
   * Get a direct URL for a file (no signing, for public files)
   */
  async getDirectUrl(
    fileKey: string,
    options?: StorageOptions
  ): Promise<string> {
    const bucket = options?.bucket || this.defaultBucket;

    // For public files in S3, we can construct a direct URL
    // Format: https://{bucket}.s3.amazonaws.com/{key}
    // or https://s3.{region}.amazonaws.com/{bucket}/{key}
    return `https://${bucket}.s3.amazonaws.com/${fileKey}`;
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
