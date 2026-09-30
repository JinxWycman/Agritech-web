import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get("staff_role")?.value;

  const isAdmin = role === "platform_admin";
  const isOfficer = role === "officer";

  if (pathname.startsWith("/admin") || pathname.startsWith("/officer")) {
    if (!isAdmin && !isOfficer) {
      const login = new URL("/login", request.url);
      return NextResponse.redirect(login);
    }
    if (pathname.startsWith("/admin") && !isAdmin) {
      return NextResponse.redirect(new URL("/officer/overview", request.url));
    }
  }

  if (pathname === "/login" && isAdmin) {
    return NextResponse.redirect(new URL("/admin/overview", request.url));
  }
  if (pathname === "/login" && isOfficer) {
    return NextResponse.redirect(new URL("/officer/overview", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/officer/:path*", "/login"],
};
