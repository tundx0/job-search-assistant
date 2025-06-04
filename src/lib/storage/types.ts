/**
 * Storage Provider Types
 * 
 * This file defines the types and interfaces for the storage system.
 */

/**
 * Supported storage providers
 */
export type StorageProvider = 'supabase' | 'aws' | 'local';

/**
 * Storage options for file operations
 */
export interface StorageOptions {
  /**
   * The storage provider to use
   * If not specified, the default provider from environment variables will be used
   */
  provider?: StorageProvider;
  
  /**
   * The bucket or container name to use
   * If not specified, the default bucket from environment variables will be used
   */
  bucket?: string;
  
  /**
   * The folder path within the bucket
   */
  path?: string;
  
  /**
   * Content type of the file (MIME type)
   * If not specified, it will be inferred from the file extension
   */
  contentType?: string;
  
  /**
   * Whether the file should be publicly accessible
   * Default: false
   */
  public?: boolean;
  
  /**
   * How long (in seconds) the file should be cached
   * Default: 3600 (1 hour)
   */
  cacheControl?: number;
  
  /**
   * Custom metadata to attach to the file
   */
  metadata?: Record<string, string>;
}

/**
 * File information returned after upload
 */
export interface FileInfo {
  /**
   * The URL where the file can be accessed
   */
  url: string;
  
  /**
   * The key or path of the file in the storage system
   */
  key: string;
  
  /**
   * The size of the file in bytes
   */
  size: number;
  
  /**
   * The content type of the file
   */
  contentType: string;
  
  /**
   * When the file was last modified
   */
  lastModified: Date;
  
  /**
   * The storage provider used
   */
  provider: StorageProvider;
}

/**
 * Interface for storage providers
 */
export interface IStorageProvider {
  /**
   * Upload a file to the storage system
   */
  uploadFile(content: string | Buffer, fileName: string, options?: StorageOptions): Promise<FileInfo>;
  
  /**
   * Download a file from the storage system
   */
  downloadFile(fileKey: string, options?: StorageOptions): Promise<string>;
  
  /**
   * Delete a file from the storage system
   */
  deleteFile(fileKey: string, options?: StorageOptions): Promise<boolean>;
  
  /**
   * Generate a signed URL for temporary access to a file
   */
  getSignedUrl(fileKey: string, expiresIn: number, options?: StorageOptions): Promise<string>;
  
  /**
   * Get a direct URL for a file (no signing, for public files)
   */
  getDirectUrl(fileKey: string, options?: StorageOptions): Promise<string>;
}
