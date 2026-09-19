import path from "path";

export const USER_STORAGE_SEGMENT = "users";

export function getStorageRoot(): string {
  return path.resolve(
    process.env.LOCAL_STORAGE_PATH || path.join(process.cwd(), "storage")
  );
}

export function getUserStoragePrefix(userId: string): string {
  return `${USER_STORAGE_SEGMENT}/${userId}`;
}

export function getAuthenticatedFileUrl(fileKey: string): string {
  return `/api/storage/file?name=${encodeURIComponent(fileKey)}`;
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

export function parseStorageKeyFromUrl(url: string): string | null {
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url, "http://localhost");
    if (parsed.pathname === "/api/storage/file") {
      return parsed.searchParams.get("name");
    }

    const storageMarker = "/storage/";
    const idx = parsed.pathname.indexOf(storageMarker);
    if (idx !== -1) {
      return decodeURIComponent(parsed.pathname.slice(idx + storageMarker.length));
    }
  } catch {
    // Fall through to relative-path handling
  }

  if (url.startsWith("/api/storage/file")) {
    const query = url.split("?")[1];
    if (!query) {
      return null;
    }
    return new URLSearchParams(query).get("name");
  }

  return null;
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
