const STAFF_PATHS = new Set(["/staff/login", "/staff/refresh", "/staff/me", "/staff/logout"]);

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
  if (STAFF_PATHS.has(path)) return path;
  if (path.startsWith("/admin/") && path.length > "/admin/".length) return path;
  return null;
}

export function stripRefreshFromStaffPayload(path: string, body: unknown): unknown {
  if (path !== "/staff/login" && path !== "/staff/refresh") return body;
  if (!body || typeof body !== "object" || Array.isArray(body)) return body;
  if (!("refresh_token" in body)) return body;
  const { refresh_token: _ignored, ...rest } = body as Record<string, unknown>;
  return rest;
}

export function rewriteSetCookie(header: string, https: boolean): string {
  let next = header.replace(/;\s*Path=\/staff(?=;|$)/gi, "; Path=/backend/staff");
  if (https && !/;\s*Secure(?=;|$)/i.test(next)) next += "; Secure";
  return next;
}
