import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Add a matcher to specify which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|css|js)$).*)',
  ],
};

export async function middleware(request: NextRequest) {
  // Skip middleware for static files and CSS
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.includes('.') ||
    request.nextUrl.pathname.startsWith('/api')
  ) {
    return NextResponse.next();
  }
  
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Public paths that don't require authentication. The password-reset screens
  // belong here too: a signed-out user is the only one who can reach them.
  const publicPaths = [
    "/",
    "/auth/login",
    "/auth/register",
    "/auth/forgot-password",
    "/auth/reset-password",
  ];

  // Check if the path is public
  const isPublicPath = publicPaths.some(
    (path) =>
      request.nextUrl.pathname === path ||
      request.nextUrl.pathname.startsWith("/api/auth")
  );

  // Redirect logic
  if (!token && !isPublicPath) {
    // Redirect to login if trying to access a protected route without being authenticated
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (
    token &&
    (request.nextUrl.pathname === "/auth/login" ||
      request.nextUrl.pathname === "/auth/register")
  ) {
    // Redirect to dashboard if already authenticated and trying to access login/register
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}
