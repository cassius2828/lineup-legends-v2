import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const MFA_VERIFY_PATH = "/sign-in/mfa-verify";

const PUBLIC_PATHS = [
  "/sign-in",
  "/forgot-password",
  "/reset-password",
  "/api/auth",
  "/_next",
  "/favicon.ico",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets and public paths
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|css|js|woff2?)$/)
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  // No token = not logged in, let NextAuth handle it
  if (!token) {
    return NextResponse.next();
  }

  // If MFA is pending, only allow the MFA verify page and auth routes
  if (token.mfaPending === true) {
    if (
      pathname === MFA_VERIFY_PATH ||
      PUBLIC_PATHS.some((p) => pathname.startsWith(p))
    ) {
      return NextResponse.next();
    }

    const url = request.nextUrl.clone();
    url.pathname = MFA_VERIFY_PATH;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:ico|png|jpg|jpeg|svg|gif|webp|css|js|woff2?)).*)",
  ],
};
