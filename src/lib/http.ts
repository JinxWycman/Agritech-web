/**
 * Backend contract mapping for the original Agritech staff models.
 *
 * The API contract is still defined by the backend as StaffUser + StaffRole
 * with values: platform_admin and officer. These helpers keep the frontend
 * aligned with that contract without rewriting the server model names.
 */
export const STAFF_ROLE_VALUES = ["platform_admin", "officer"] as const;
export const STAFF_PROXY_PATHS = ["/staff/login", "/staff/refresh", "/staff/me", "/staff/logout"] as const;

export const STAFF_HOME = {
  platform_admin: "/admin/overview",
  officer: "/officer/overview",
} as const;

export const STAFF_ROLE_LABELS = {
  platform_admin: "Admin",
  officer: "Officer",
} as const;

export type StaffRoleName = (typeof STAFF_ROLE_VALUES)[number];

export function isStaffRole(value: string | null | undefined): value is StaffRoleName {
  return STAFF_ROLE_VALUES.includes(value as StaffRoleName);
}

export function staffHome(role: string | null | undefined): string | null {
  return isStaffRole(role) ? STAFF_HOME[role] : null;
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
  const allowed = pathOnly.startsWith("/admin") || pathOnly.startsWith("/officer") || pathOnly.startsWith("/farmer");
  if (!allowed) return null;
  if (role === "officer" && pathOnly.startsWith("/admin")) return STAFF_HOME.officer;
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
