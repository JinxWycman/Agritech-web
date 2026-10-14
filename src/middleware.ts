import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { guardedDestination, homeForRole, legacyRoute } from "@/lib/route-guards";
import type { UserRole } from "@/types/domain";

/**
 * Navigation aid only. Demo cookies contain a persona, never credentials.
 * API mode cookies also only route users; the backend must enforce authorization.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const mode = process.env.NEXT_PUBLIC_DATA_MODE === "api" ? "api" : "mock";
  const role = mode === "mock"
    ? request.cookies.get("demo_role")?.value
    : request.cookies.get("portal_role")?.value;
  const validRole: UserRole | null = role === "farmer" || role === "expert" || role === "admin" ? role : null;

  const oldPath = legacyRoute(pathname);
  if (oldPath) return NextResponse.redirect(new URL(oldPath + request.nextUrl.search, request.url));
  if (pathname === "/") {
    const home = validRole ? homeForRole(validRole) : "/login";
    return NextResponse.redirect(new URL(home, request.url));
  }
  const guardDestination = guardedDestination(pathname, request.nextUrl.search, validRole);
  if (guardDestination) return NextResponse.redirect(new URL(guardDestination, request.url));
  if (pathname === "/login" && validRole) {
    return NextResponse.redirect(new URL(homeForRole(validRole), request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/app/:path*", "/expert/:path*", "/admin/:path*", "/farmer/:path*", "/officer/:path*", "/login"],
};
