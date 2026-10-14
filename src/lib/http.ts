/**
 * Backend contract mapping for the original Agritech staff models.
 *
 * The API contract is still defined by the backend as StaffUser + StaffRole
 * with values: platform_admin and officer. These helpers keep the frontend
 * aligned with that contract without rewriting the server model names.
 */
export const STAFF_ROLE_VALUES = ["platform_admin", "officer"] as const;
export const STAFF_PROXY_PATHS = ["/staff/login", "/staff/refresh", "/staff/me", "/staff/logout"] as const;

export const STAFF_ROLE_LABELS = {
  platform_admin: "Admin",
  officer: "Officer",
} as const;

export type StaffRoleName = (typeof STAFF_ROLE_VALUES)[number];

export function isStaffRole(value: string | null | undefined): value is StaffRoleName {
  return STAFF_ROLE_VALUES.includes(value as StaffRoleName);
}

export function staffHome(role: string | null | undefined): string | null {
  if (role === "farmer") return "/app/overview";
  if (role === "expert") return "/expert/overview";
  if (role === "admin") return "/admin/overview";
  return null;
}

export function staffRoleLabel(role: string | null | undefined): string | null {
  return isStaffRole(role) ? STAFF_ROLE_LABELS[role] : null;
}

/** After login, only bounce back to our own supported app routes — never to another website. */
export function safeNextPath(value: string | null | undefined, role?: string | null): string | null {
  if (!value || value.length > 180) return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\") || value.includes("://")) return null;
  const pathOnly = value.split("?")[0];
  if (pathOnly.includes("..") || pathOnly.includes("#")) return null;
  const allowed = pathOnly.startsWith("/admin") || pathOnly.startsWith("/expert") || pathOnly.startsWith("/app");
  if (!allowed) return null;
  if (role === "expert" && pathOnly.startsWith("/admin")) return "/expert/overview";
  if (role === "farmer" && !pathOnly.startsWith("/app")) return "/app/overview";
  if (role === "admin" && !pathOnly.startsWith("/admin")) return "/admin/overview";
  if (role === "expert" && !pathOnly.startsWith("/expert")) return "/expert/overview";
  return value;
}

type ValidationIssue = { loc?: unknown; msg?: unknown };

export function formatApiDetail(detail: unknown, fallback: string): string {
  if (typeof detail === "string" && detail.trim()) return detail;
  if (Array.isArray(detail)) {
    const parts = detail
      .map((item) => {
        if (typeof item === "string" && item.trim()) return item;
        if (!item || typeof item !== "object") return "";
        const issue = item as ValidationIssue;
        const msg = typeof issue.msg === "string" ? issue.msg : "";
        if (!msg) return "";
        const loc = Array.isArray(issue.loc)
          ? issue.loc
              .filter((part) => part !== "body" && part !== "query")
              .map((part) => String(part).replace(/_/g, " "))
              .join(" ")
          : "";
        return loc ? `${loc}: ${msg}` : msg;
      })
      .filter(Boolean);
    if (parts.length) return parts.join(". ");
  }
  return fallback;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export const OFFLINE_MESSAGE = "Cannot reach the server.";

export async function httpRequest(
  url: string,
  init: RequestInit,
  mode: "mock" | "api" = process.env.NEXT_PUBLIC_DATA_MODE === "api" ? "api" : "mock",
  fetcher: typeof fetch = fetch,
): Promise<Response> {
  if (mode === "mock") {
    throw new ApiError("Backend requests are disabled in mock mode.", 0);
  }
  return fetcher(url, init);
}
