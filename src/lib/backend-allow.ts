/**
 * Allow-list for the Next.js /backend proxy.
 * The backend contract keeps the verified staff and farmer endpoints on the same-origin route.
 * Farmer phone webhooks and M-Pesa must stay on the API host — this site must not forward them.
 */
const STAFF_PATHS = new Set([
  "/staff/login",
  "/staff/refresh",
  "/staff/me",
  "/staff/logout",
]);

const FARMER_PATHS = new Set([
  "/auth/login",
  "/auth/me",
  "/farmers/login",
  "/farmers/me",
  "/farmers/change-pin",
]);

export function allowedBackendPath(segments: string[]): string | null {
  if (!segments.length) return null;
  if (
    segments.some(
      (part) =>
        !part ||
        part === "." ||
        part === ".." ||
        part.includes("/") ||
        part.includes("\\") ||
        part.includes("%") ||
        part.includes("?"),
    )
  ) {
    return null;
  }
  const path = `/${segments.join("/")}`;
  if (STAFF_PATHS.has(path) || FARMER_PATHS.has(path)) return path;
  if (path.startsWith("/admin/") && path.length > "/admin/".length) return path;
  return null;
}

/** Refresh tokens belong in the HttpOnly cookie, not in JavaScript. */
export function stripRefreshFromStaffPayload(path: string, body: unknown): unknown {
  if (path !== "/staff/login" && path !== "/staff/refresh") return body;
  if (!body || typeof body !== "object" || Array.isArray(body)) return body;
  if (!("refresh_token" in body)) return body;
  const rest = { ...(body as Record<string, unknown>) };
  delete rest.refresh_token;
  return rest;
}

/** Cookie Path=/staff on FastAPI becomes Path=/backend/staff on this site. */
export function rewriteSetCookie(header: string, https: boolean): string {
  let next = header.replace(/;\s*Path=\/staff(?=;|$)/gi, "; Path=/backend/staff");
  if (https && !/;\s*Secure(?=;|$)/i.test(next)) next += "; Secure";
  return next;
}
