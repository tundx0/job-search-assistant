import path from "path";
import type { StorageProvider } from "./types";

export const USER_STORAGE_SEGMENT = "users";
export const STORAGE_PROVIDERS = ["local", "aws", "supabase"] as const;

export type ParsedStorageLocation = {
  key: string;
  provider?: StorageProvider;
  bucket?: string;
};

export function getStorageRoot(): string {
  return path.resolve(
    process.env.LOCAL_STORAGE_PATH || path.join(process.cwd(), "storage")
  );
}

export function getUserStoragePrefix(userId: string): string {
  return `${USER_STORAGE_SEGMENT}/${userId}`;
}

export function getAuthenticatedFileUrl(
  fileKey: string,
  options?: { provider?: StorageProvider; bucket?: string }
): string {
  const params = new URLSearchParams();
  params.set("name", fileKey);
  if (options?.provider) {
    params.set("provider", options.provider);
  }
  if (options?.bucket) {
    params.set("bucket", options.bucket);
  }
  return `/api/storage/file?${params.toString()}`;
}

export function isStorageProvider(value: string): value is StorageProvider {
  return (STORAGE_PROVIDERS as readonly string[]).includes(value);
}

export function parseStorageProviderParam(
  value: string | null
): StorageProvider | undefined {
  if (!value) {
    return undefined;
  }
  const normalized = value.trim().toLowerCase();
  return isStorageProvider(normalized) ? normalized : undefined;
}

/**
 * Returns undefined when omitted, the bucket name when valid, and null when
 * the value is present but unsafe.
 */
export function parseStorageBucketParam(value: string | null): string | null | undefined {
  if (value == null || value === "") {
    return undefined;
  }
  const bucket = value.trim();
  if (
    bucket.length < 3 ||
    bucket.length > 63 ||
    bucket.includes("..") ||
    bucket.includes("/") ||
    bucket.includes("\\") ||
    bucket.includes("\0") ||
    !/^[A-Za-z0-9][A-Za-z0-9._-]*[A-Za-z0-9]$/.test(bucket)
  ) {
    return null;
  }
  return bucket;
}

/**
 * App-local legacy path (`/storage/resume.pdf`), not Supabase's `/storage/v1/`.
 */
export function isLegacyAppStoragePath(pathname: string): boolean {
  return (
    pathname.startsWith("/storage/") && !pathname.startsWith("/storage/v1/")
  );
}

/**
 * Reject absolute paths, traversal, and NUL bytes. Returns a normalized
 * relative key using forward slashes, or null if the input is unsafe.
 */
export function sanitizeStorageKey(name: string): string | null {
  if (!name || typeof name !== "string") {
    return null;
  }

  const trimmed = name.trim();
  if (!trimmed || trimmed.includes("\0")) {
    return null;
  }

  const unified = trimmed.replace(/\\/g, "/");

  if (path.isAbsolute(unified) || unified.startsWith("/")) {
    return null;
  }

  if (/^[a-zA-Z]:\//.test(unified)) {
    return null;
  }

  if (unified.includes("://")) {
    return null;
  }

  const parts = unified.split("/").filter((part) => part && part !== ".");
  if (parts.length === 0 || parts.some((part) => part === "..")) {
    return null;
  }

  return parts.join("/");
}

/**
 * Resolve a requested file name to a key that is owned by `userId`.
 * Keys under another user's prefix are rejected.
 */
export function resolveOwnedStorageKey(
  name: string,
  userId: string,
  options?: { allowAdmin?: boolean }
): string | null {
  const sanitized = sanitizeStorageKey(name);
  if (!sanitized) {
    return null;
  }

  const prefix = getUserStoragePrefix(userId);

  if (sanitized === prefix || sanitized.startsWith(`${prefix}/`)) {
    return sanitized;
  }

  if (sanitized.startsWith(`${USER_STORAGE_SEGMENT}/`)) {
    if (options?.allowAdmin) {
      return sanitized;
    }
    return null;
  }

  return `${prefix}/${sanitized}`;
}

export function legacyJobFileNames(jobId: string): string[] {
  return [
    `resume-${jobId}.json`,
    `resume-${jobId}.pdf`,
    `cover-letter-${jobId}.txt`,
  ];
}

/**
 * Resolve a stored resume/cover-letter location for a job the caller already
 * owns. New objects live under `users/{userId}/`; legacy objects used the
 * bare `resume-{jobId}.*` key at the bucket root.
 */
export function resolveJobOwnedStorageKey(
  name: string,
  userId: string,
  jobId: string,
  options?: { allowAdmin?: boolean }
): string | null {
  const sanitized = sanitizeStorageKey(name);
  if (!sanitized) {
    return null;
  }

  const prefix = getUserStoragePrefix(userId);
  if (sanitized === prefix || sanitized.startsWith(`${prefix}/`)) {
    return sanitized;
  }

  if (sanitized.startsWith(`${USER_STORAGE_SEGMENT}/`)) {
    if (options?.allowAdmin) {
      return sanitized;
    }
    return null;
  }

  const baseName = sanitized.split("/").pop() || sanitized;
  if (legacyJobFileNames(jobId).includes(baseName) && !sanitized.includes("/")) {
    return sanitized;
  }

  return `${prefix}/${sanitized}`;
}

/**
 * Resolve a storage key to an absolute filesystem path under the storage root.
 * Returns null if the path would escape the root.
 */
export function resolveStorageFsPath(
  storageRoot: string,
  fileKey: string
): string | null {
  const sanitized = sanitizeStorageKey(fileKey);
  if (!sanitized) {
    return null;
  }

  const root = path.resolve(storageRoot);
  const fullPath = path.resolve(root, sanitized);
  const rootPrefix = root.endsWith(path.sep) ? root : `${root}${path.sep}`;

  if (fullPath !== root && !fullPath.startsWith(rootPrefix)) {
    return null;
  }

  return fullPath;
}

function locationFromApiSearchParams(
  searchParams: URLSearchParams
): ParsedStorageLocation | null {
  const name = searchParams.get("name");
  if (!name) {
    return null;
  }
  const key = sanitizeStorageKey(name);
  if (!key) {
    return null;
  }

  const providerParam = searchParams.get("provider");
  const provider = parseStorageProviderParam(providerParam);
  if (providerParam && !provider) {
    return null;
  }

  const bucketParam = searchParams.get("bucket");
  const bucket = parseStorageBucketParam(bucketParam);
  if (bucketParam && bucket == null) {
    return null;
  }

  return {
    key,
    provider,
    bucket: bucket || undefined,
  };
}

function parseS3Location(parsed: URL): ParsedStorageLocation | null {
  const host = parsed.hostname.toLowerCase();
  const pathname = decodeURIComponent(parsed.pathname).replace(/^\/+/, "");
  if (!pathname) {
    return null;
  }

  const virtualHosted = host.match(
    /^(.+)\.s3(?:[.-][a-z0-9-]+)*\.amazonaws\.com$/i
  );
  if (virtualHosted) {
    const bucket = parseStorageBucketParam(virtualHosted[1]);
    const key = sanitizeStorageKey(pathname);
    if (!key || bucket == null) {
      return null;
    }
    return { key, provider: "aws", bucket: bucket || undefined };
  }

  const pathStyle = /^s3(?:[.-][a-z0-9-]+)*\.amazonaws\.com$/i.test(host);
  if (pathStyle) {
    const slash = pathname.indexOf("/");
    if (slash <= 0) {
      return null;
    }
    const bucket = parseStorageBucketParam(pathname.slice(0, slash));
    const key = sanitizeStorageKey(pathname.slice(slash + 1));
    if (!key || bucket == null) {
      return null;
    }
    return { key, provider: "aws", bucket: bucket || undefined };
  }

  return null;
}

function parseSupabaseLocation(parsed: URL): ParsedStorageLocation | null {
  const match = parsed.pathname.match(
    /^\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/(.+)$/
  );
  if (!match) {
    return null;
  }
  const bucket = parseStorageBucketParam(decodeURIComponent(match[1]));
  const key = sanitizeStorageKey(decodeURIComponent(match[2]));
  if (!key || bucket == null) {
    return null;
  }
  return { key, provider: "supabase", bucket };
}

export function parseStorageLocationFromUrl(
  url: string
): ParsedStorageLocation | null {
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url, "http://localhost");
    if (parsed.pathname === "/api/storage/file") {
      return locationFromApiSearchParams(parsed.searchParams);
    }

    const supabase = parseSupabaseLocation(parsed);
    if (supabase) {
      return supabase;
    }

    if (isLegacyAppStoragePath(parsed.pathname)) {
      const key = sanitizeStorageKey(
        decodeURIComponent(parsed.pathname.slice("/storage/".length))
      );
      return key ? { key, provider: "local" } : null;
    }

    const s3 = parseS3Location(parsed);
    if (s3) {
      return s3;
    }
  } catch {
    // Fall through to relative-path handling
  }

  if (url.startsWith("/api/storage/file")) {
    const query = url.includes("?") ? url.slice(url.indexOf("?") + 1) : "";
    return locationFromApiSearchParams(new URLSearchParams(query));
  }

  if (url.startsWith("/storage/v1/")) {
    return null;
  }

  if (url.startsWith("/storage/")) {
    const key = sanitizeStorageKey(url.slice("/storage/".length));
    return key ? { key, provider: "local" } : null;
  }

  return null;
}

export function parseStorageKeyFromUrl(url: string): string | null {
  return parseStorageLocationFromUrl(url)?.key ?? null;
}

export function getContentTypeForFile(fileName: string): string {
  const extension = path.extname(fileName).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".txt": "text/plain; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".md": "text/markdown; charset=utf-8",
    ".pdf": "application/pdf",
  };

  return mimeTypes[extension] || "application/octet-stream";
}
