import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { safeNextPath } from "@/lib/http";

/**
 * Door check only. Real permission is the staff JWT on the API.
 * staff_role cookie just sends admins and officers to the right home page.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get("staff_role")?.value;

  const isAdmin = role === "platform_admin";
  const isOfficer = role === "officer";

  if (pathname.startsWith("/admin") || pathname.startsWith("/officer")) {
    if (!isAdmin && !isOfficer) {
      const login = new URL("/login", request.url);
      const next = `${pathname}${request.nextUrl.search}`;
      if (next.startsWith("/admin") || next.startsWith("/officer")) {
        login.searchParams.set("next", next.slice(0, 180));
      }
      return NextResponse.redirect(login);
    }
    if (pathname.startsWith("/admin") && !isAdmin) {
      return NextResponse.redirect(new URL("/officer/overview", request.url));
    }
  }

  if (pathname === "/login" && isAdmin) {
    const dest = safeNextPath(request.nextUrl.searchParams.get("next"), "platform_admin") || "/admin/overview";
    return NextResponse.redirect(new URL(dest, request.url));
  }
  if (pathname === "/login" && isOfficer) {
    return NextResponse.redirect(new URL("/officer/overview", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/officer/:path*", "/login"],
};
