import type { UserRole } from "@/types/domain";

export function homeForRole(role: UserRole): string {
  return role === "farmer" ? "/app/overview" : role === "expert" ? "/expert/overview" : "/admin/overview";
}

export function roleForPath(pathname: string): UserRole | null {
  if (pathname === "/app" || pathname.startsWith("/app/")) return "farmer";
  if (pathname === "/expert" || pathname.startsWith("/expert/")) return "expert";
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return "admin";
  return null;
}

export function legacyRoute(pathname: string): string | null {
  if (pathname === "/farmer/login") return "/login";
  if (pathname === "/farmer") return "/app";
  if (pathname.startsWith("/farmer/")) return `/app${pathname.slice("/farmer".length)}`;
  if (pathname === "/officer") return "/expert";
  if (pathname.startsWith("/officer/")) return `/expert${pathname.slice("/officer".length)}`;
  return null;
}

export function guardedDestination(pathname: string, search: string, role: UserRole | null): string | null {
  const targetRole = roleForPath(pathname);
  if (!targetRole || targetRole === role) return null;
  if (role) return homeForRole(role);
  return `/login${search ? `?next=${encodeURIComponent(pathname + search)}` : `?next=${encodeURIComponent(pathname)}`}`;
}
