import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { isGuestOnlyAuthPath, isPublicPath } from "@/lib/auth/public-paths";

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js)$).*)",
  ],
};

export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  const next = () =>
    NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

  if (
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.includes(".") ||
    request.nextUrl.pathname.startsWith("/api")
  ) {
    return next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const pathname = request.nextUrl.pathname;

  if (!token && !isPublicPath(pathname)) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (token && isGuestOnlyAuthPath(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return next();
}
