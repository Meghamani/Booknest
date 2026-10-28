import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // If the request looks like it's for a static file (has an extension) — skip auth middleware
  // This prevents the Next image optimizer (/_next/image) from being redirected to /login
  // when it fetches a public asset like `/silent-patient.jpg`.
  const staticFileRegex = /\.[a-z0-9]+$/i; // matches ".jpg", ".png", ".woff2", etc.
  if (staticFileRegex.test(pathname)) {
    // quick debug hint — only enabled in dev (keeps logs minimal)
    if (process.env.NODE_ENV !== 'production') {
      console.log('[middleware] skipping auth for static asset:', pathname);
    }
    return NextResponse.next();
  }

  const token = req.cookies.get("auth_token")?.value;

  const publicPaths = ["/login", "/register"];
  // const pathname = req.nextUrl.pathname; // already defined above

  // 1️⃣ Handle public paths
  const isPublic = publicPaths.some((path) => pathname.startsWith(path));
  if (isPublic) {
    // If logged-in user tries to access login/register, redirect to dashboard
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // 2️⃣ Handle root "/" as dynamic landing
  if (pathname === "/") {
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    } else {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // 3️⃣ Protect all other private routes
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
};
