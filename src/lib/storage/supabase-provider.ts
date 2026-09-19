import { IStorageProvider, StorageOptions, FileInfo } from "./types";
import { sdkBodyToBuffer } from "./bytes";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * S3 Storage Provider using AWS S3 SDK
 */
export class SupabaseStorageProvider implements IStorageProvider {
  private s3Client: S3Client;
  private defaultBucket: string;

  constructor() {
    // Get S3 configuration from environment variables
    const endpoint = process.env.SUPABASE_URL || "";
    const region = process.env.S3_REGION || "eu-central-1";
    const accessKeyId = process.env.S3_ACCESS_KEY_ID || "";
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || "";
    this.defaultBucket = process.env.S3_BUCKET || "job-application";

    if (!endpoint || !accessKeyId || !secretAccessKey) {
      console.warn("S3 credentials not found. Storage will not work properly.");
    }

    // Create S3 client using S3 credentials
    this.s3Client = new S3Client({
      forcePathStyle: true,
      region: region,
      endpoint: endpoint,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
    });
  }

  async uploadFile(
    content: string | Buffer,
    fileName: string,
    options?: StorageOptions
  ): Promise<FileInfo> {
    const bucket = options?.bucket || this.defaultBucket;
    const path = options?.path || "";
    const fullPath = path ? `${path}/${fileName}` : fileName;

    const buffer = typeof content === "string" ? Buffer.from(content) : content;

    const contentType = options?.contentType || this.getContentType(fileName);

    try {
      try {
        await this.s3Client.send(new HeadBucketCommand({ Bucket: bucket }));
      } catch (error) {
        console.log((error as Error).message);

        console.log("Bucket does not exist, creating...");
        await this.s3Client.send(
          new CreateBucketCommand({
            Bucket: bucket,
          })
        );
      }

      const putCommand = new PutObjectCommand({
        Bucket: bucket,
        Key: fullPath,
        Body: buffer,
        ContentType: contentType,
        CacheControl: `max-age=${options?.cacheControl || 3600}`,
      });

      await this.s3Client.send(putCommand);

      let url: string;
      if (options?.public) {
        const baseUrl = (process.env.SUPABASE_URL || "").replace(
          "/storage/v1/s3",
          ""
        );
        url = `${baseUrl}/storage/v1/object/public/${bucket}/${fullPath}`;
      } else {
        const getCommand = new GetObjectCommand({
          Bucket: bucket,
          Key: fullPath,
        });
        url = await getSignedUrl(this.s3Client, getCommand, {
          expiresIn: 3600,
        });
      }

      return {
        url,
        key: fullPath,
        size: buffer.length,
        contentType,
        lastModified: new Date(),
        provider: "supabase",
      };
    } catch (error) {
      console.error("Error uploading file using S3 SDK:", error);
      throw new Error(`Failed to upload file: ${(error as Error).message}`);
    }
  }

  /**
   * Download a file from storage using AWS S3 SDK as UTF-8 text
   */
  async downloadFile(
    fileKey: string,
    options?: StorageOptions
  ): Promise<string> {
    const buffer = await this.downloadFileBuffer(fileKey, options);
    return buffer.toString("utf-8");
  }

  async downloadFileBuffer(
    fileKey: string,
    options?: StorageOptions
  ): Promise<Buffer> {
    const bucket = options?.bucket || this.defaultBucket;

    try {
      const getCommand = new GetObjectCommand({
        Bucket: bucket,
        Key: fileKey,
      });

      const response = await this.s3Client.send(getCommand);

      if (!response.Body) {
        throw new Error("File not found or empty");
      }

      return await sdkBodyToBuffer(response.Body);
    } catch (error) {
      console.error("Error downloading file using S3 SDK:", error);
      throw new Error(`Failed to download file: ${(error as Error).message}`);
    }
  }

  async deleteFile(
    fileKey: string,
    options?: StorageOptions
  ): Promise<boolean> {
    const bucket = options?.bucket || this.defaultBucket;

    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: bucket,
        Key: fileKey,
      });

      await this.s3Client.send(deleteCommand);

      return true;
    } catch (error) {
      console.error("Error deleting file using S3 SDK:", error);
      throw new Error(`Failed to delete file: ${(error as Error).message}`);
    }
  }

  async getSignedUrl(
    fileKey: string,
    expiresIn: number = 3600,
    options?: StorageOptions
  ): Promise<string> {
    const bucket = options?.bucket || this.defaultBucket;

    try {
      const getCommand = new GetObjectCommand({
        Bucket: bucket,
        Key: fileKey,
      });

      const url = await getSignedUrl(this.s3Client, getCommand, { expiresIn });
      return url;
    } catch (error) {
      console.error("Error generating signed URL using S3 SDK:", error);
      throw new Error(
        `Failed to generate signed URL: ${(error as Error).message}`
      );
    }
  }

  async getDirectUrl(
    fileKey: string,
    options?: StorageOptions
  ): Promise<string> {
    const bucket = options?.bucket || this.defaultBucket;

    try {
      // For Supabase Storage, construct a direct URL to the public bucket
      // We need to modify the URL to use /storage/v1/object/public/ format
      const baseUrl = (process.env.SUPABASE_URL || "").replace(
        "/storage/v1/s3",
        ""
      );
      return `${baseUrl}/storage/v1/object/public/${bucket}/${fileKey}`;
    } catch (error) {
      console.error("Error generating direct URL for Supabase storage:", error);
      throw new Error(
        `Failed to generate direct URL: ${(error as Error).message}`
      );
    }
  }

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
