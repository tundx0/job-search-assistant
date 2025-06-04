import { createHash } from "crypto";

/**
 * Create a hash from an object for caching purposes
 * @param obj The object to hash
 * @returns A hash string
 */
export function createObjectHash<T>(obj: T): string {
  const str = JSON.stringify(obj);
  return createHash("sha256").update(str).digest("hex");
}
