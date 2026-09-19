/**
 * Job applications store either a raw storage key or the authenticated app
 * URL that `storeFile` returns (`/api/storage/file?name=<key>&…`). Reading a
 * document back in-process needs the key, not the URL, so unwrap it here
 * rather than making an HTTP request to ourselves.
 */
export function storageKeyFromLocation(location: string): string | null {
  if (!location) return null;

  if (!location.includes("/api/storage/file")) {
    // Already a plain key.
    return location;
  }

  try {
    // Relative URLs need a base; the origin is irrelevant to the parse.
    const url = new URL(location, "http://localhost");
    return url.searchParams.get("name");
  } catch {
    return null;
  }
}
