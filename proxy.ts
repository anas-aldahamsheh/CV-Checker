import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/") return NextResponse.redirect(new URL("/en", request.url));
  
  // Allow API routes, localized routes, Next.js internals, and static assets with file extensions
  const isStaticAsset = pathname.includes(".") || pathname.startsWith("/icon") || pathname.startsWith("/favicon");
  const validPath =
    isStaticAsset ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/en") ||
    pathname.startsWith("/ar") ||
    pathname.startsWith("/_next");

  return validPath ? NextResponse.next() : NextResponse.redirect(new URL(`/en${pathname}`, request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|icon.png|.*\\.(?:svg|png|ico|jpg|jpeg|webp|pdf)$).*)"],
};
