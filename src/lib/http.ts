export const STAFF_HOME = {
  platform_admin: "/admin/overview",
  officer: "/officer/overview",
} as const;

export type StaffRoleName = keyof typeof STAFF_HOME;

export function isStaffRole(value: string | null | undefined): value is StaffRoleName {
  return value === "platform_admin" || value === "officer";
}

export function staffHome(role: string | null | undefined): string | null {
  return isStaffRole(role) ? STAFF_HOME[role] : null;
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

export const OFFLINE_MESSAGE =
  "Cannot reach the Agritech API. Check your connection and that the server is running.";
