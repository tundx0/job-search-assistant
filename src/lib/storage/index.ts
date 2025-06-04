/**
 * File Storage Service
 *
 * This service provides an abstraction for storing and retrieving files.
 * It supports multiple storage providers (AWS S3, Supabase, Local) and allows
 * easy switching between them.
 */
import { AwsStorageProvider } from "./aws-provider";
import { SupabaseStorageProvider } from "./supabase-provider";
import { LocalStorageProvider } from "./local-provider";
import {
  StorageProvider,
  StorageOptions,
  FileInfo,
  IStorageProvider,
} from "./types";
import { ResumeJSON } from "@/lib/ai/simple-json-generation";

// Provider instances cache
let awsProvider: AwsStorageProvider | null = null;
let supabaseProvider: SupabaseStorageProvider | null = null;
let localProvider: LocalStorageProvider | null = null;

/**
 * Get the currently configured storage provider
 */
export function getStorageProvider(): StorageProvider {
  // Check if a specific provider is explicitly enabled
  if (process.env.STORAGE_PROVIDER) {
    const provider = process.env.STORAGE_PROVIDER.toLowerCase();
    if (provider === "aws" || provider === "supabase" || provider === "local") {
      return provider as StorageProvider;
    }
  }

  // Check if AWS S3 is available
  const awsAvailable =
    !!process.env.AWS_ACCESS_KEY_ID && !!process.env.AWS_SECRET_ACCESS_KEY;

  // Check if Supabase is available
  const supabaseAvailable =
    !!process.env.SUPABASE_URL &&
    (!!process.env.SUPABASE_SERVICE_KEY || !!process.env.SUPABASE_ANON_KEY);

  // Determine which provider to use based on available credentials
  if (awsAvailable) {
    return "aws";
  } else if (supabaseAvailable) {
    return "supabase";
  } else {
    return "local"; // Default to local for development
  }
}

/**
 * Get the provider instance for the specified provider
 */
export function getProvider(provider?: StorageProvider): IStorageProvider {
  const providerType = provider || getStorageProvider();

  switch (providerType) {
    case "aws":
      if (!awsProvider) {
        awsProvider = new AwsStorageProvider();
      }
      return awsProvider;

    case "supabase":
      if (!supabaseProvider) {
        supabaseProvider = new SupabaseStorageProvider();
      }
      return supabaseProvider;

    case "local":
      if (!localProvider) {
        localProvider = new LocalStorageProvider();
      }
      return localProvider;

    default:
      // Default to local provider
      if (!localProvider) {
        localProvider = new LocalStorageProvider();
      }
      return localProvider;
  }
}

/**
 * Store a file in the storage system
 * @param content The content to store
 * @param fileName The file name
 * @param options Storage options
 * @returns File information including URL and metadata
 */
export async function storeFile(
  content: string | Buffer,
  fileName: string,
  options?: StorageOptions
): Promise<FileInfo> {
  const provider = getProvider(options?.provider);
  const fileInfo = await provider.uploadFile(content, fileName, options);

  // If the file is public, use a direct URL instead of a signed URL
  if (options?.public) {
    try {
      fileInfo.url = await provider.getDirectUrl(fileInfo.key, options);
    } catch (error) {
      console.warn("Failed to get direct URL, using default URL", error);
    }
  }

  return fileInfo;
}

/**
 * Retrieve a file from the storage system
 * @param fileKey The file key or path
 * @param options Storage options
 * @returns The file content
 */
export async function retrieveFile(
  fileKey: string,
  options?: StorageOptions
): Promise<string> {
  const provider = getProvider(options?.provider);
  return await provider.downloadFile(fileKey, options);
}

/**
 * Delete a file from the storage system
 * @param fileKey The file key or path
 * @param options Storage options
 * @returns True if the file was deleted successfully
 */
export async function deleteFile(
  fileKey: string,
  options?: StorageOptions
): Promise<boolean> {
  const provider = getProvider(options?.provider);
  return await provider.deleteFile(fileKey, options);
}

/**
 * Generate a signed URL for temporary access to a file
 * @param fileKey The file key or path
 * @param expiresIn How long the URL should be valid for (in seconds)
 * @param options Storage options
 * @returns A signed URL
 */
export async function getSignedUrl(
  fileKey: string,
  expiresIn: number = 3600,
  options?: StorageOptions
): Promise<string> {
  const provider = getProvider(options?.provider);
  return await provider.getSignedUrl(fileKey, expiresIn, options);
}

/**
 * Get a direct URL for a file (no signing, for public files)
 * @param fileKey The file key or path
 * @param options Storage options
 * @returns A direct URL to the file
 */
export async function getDirectUrl(
  fileKey: string,
  options?: StorageOptions
): Promise<string> {
  const provider = getProvider(options?.provider);
  return await provider.getDirectUrl(fileKey, options);
}

/**
 * Generate a PDF from resume/cover letter content and upload to storage.
 * @param content The resume or cover letter content (plain text or markdown)
 * @param fileName The file name for the PDF
 * @param options Storage options
 * @returns The URL or identifier for the stored PDF
 */

export async function generatePDF(
  content: string,
  fileName: string,
  optionsOrJsonData?: StorageOptions | ResumeJSON
): Promise<string> {
  try {
    const { generateDocumentPDF } = await import("../pdf/pdf-service");

    // Determine if the third parameter is JSON data or storage options
    const isJsonData = optionsOrJsonData && "header" in optionsOrJsonData;
    const options = isJsonData ? {} : (optionsOrJsonData as StorageOptions);
    const jsonData = isJsonData ? (optionsOrJsonData as ResumeJSON) : undefined;

    const pdfBuffer = await generateDocumentPDF(content, fileName, jsonData);

    const provider = getProvider(options?.provider);

    const fileInfo = await provider.uploadFile(
      pdfBuffer,
      fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`,
      {
        ...options,
        contentType: "application/pdf",
        public: true,
      }
    );

    return fileInfo.url;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error(
      `Failed to generate PDF: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
