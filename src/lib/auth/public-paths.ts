const PUBLIC_EXACT_PATHS = new Set([
  "/",
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/error",
  "/auth/logout",
]);

const GUEST_ONLY_AUTH_PATHS = new Set(["/auth/login", "/auth/register"]);

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_EXACT_PATHS.has(pathname);
}

export function isGuestOnlyAuthPath(pathname: string): boolean {
  return GUEST_ONLY_AUTH_PATHS.has(pathname);
}
