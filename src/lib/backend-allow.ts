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
  "/auth/refresh",
  "/auth/me",
  "/farmers/login",
  "/farmers/register",
  "/farmers/me",
  "/farmers/change-pin",
  "/experts",
  "/experts/",
  "/expert-request",
  "/expert-request/status",
  "/experts/me",
  "/experts/me/requests",
  "/experts/me/availability",
  "/farmer-crops",
  "/farmer-crops/",
  "/farmer-livestock",
  "/farmer-livestock/",
  "/counties",
  "/crops",
  "/livestock",
  "/weather",
  "/farmers/me/expert-requests",
  "/vendors",
  "/outbreak-alerts/nearby",
  "/notifications/unread-count",
  "/notifications/mark-all-read",
  "/recommendations",
  "/recommendations/",
  "/recommendations/environment",
  "/recommendations/generate",
  "/recommendations/jobs",
  "/notifications",
  "/notifications/",
  "/market-prices",
  "/market-prices/",
  "/market-prices/scrape",
  "/advisories",
  "/advisories/",
  "/products",
  "/products/",
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
  if (path === "/counties/locate") return path;
  if (/^\/counties\/[0-9a-f-]+\/constituencies$/i.test(path)) return path;
  if (/^\/counties\/constituencies\/[0-9a-f-]+\/wards$/i.test(path)) return path;
  if (/^\/farmers\/me\/expert-requests\/[0-9a-f-]+(?:\/(?:cancel|feedback))?$/i.test(path)) return path;
  if (/^\/vendors\/[0-9a-f-]+(?:\/(?:products|events))?$/i.test(path)) return path;
  if (/^\/experts\/me\/requests\/[0-9a-f-]+$/i.test(path)) return path;
  if (/^\/notifications\/[0-9a-f-]+\/read$/i.test(path)) return path;
  if (/^\/farmer-crops\/[0-9a-f-]+$/i.test(path)) return path;
  if (/^\/farmer-livestock\/[0-9a-f-]+$/i.test(path)) return path;
  if (/^\/recommendations\/[0-9a-f-]+(?:\/sms)?$/i.test(path)) return path;
  if (/^\/recommendations\/jobs\/[0-9a-f-]+$/i.test(path)) return path;
  if (/^\/market-prices\/(?:county|crop)\/[0-9a-f-]+$/i.test(path)) return path;
  if (/^\/advisories\/(?:county|category)\/[^/]+$/i.test(path)) return path;
  if (/^\/advisories\/[0-9a-f-]+$/i.test(path)) return path;
  if (/^\/products\/(?:category\/[^/]+|[0-9a-f-]+)$/i.test(path)) return path;
  if (path.startsWith("/admin/") && path.length > "/admin/".length) return path;
  return null;
}

/** Limit each forwarded path to methods actually provided by the backend. */
export function allowedBackendMethod(method: string, path: string): boolean {
  const verb = method.toUpperCase();
  if (path.startsWith("/admin/")) return ["GET", "POST", "PATCH", "DELETE"].includes(verb);
  if (path === "/auth/login" || path === "/auth/refresh" || path === "/farmers/login" || path === "/farmers/register" || path === "/staff/login" || path === "/staff/refresh" || path === "/staff/logout" || path === "/expert-request") return verb === "POST";
  if (path === "/farmer-crops" || path === "/farmer-crops/" || path === "/farmer-livestock" || path === "/farmer-livestock/") return ["GET", "POST"].includes(verb);
  if (path === "/market-prices" || path === "/market-prices/") return ["GET", "POST"].includes(verb);
  if (path === "/market-prices/scrape") return verb === "POST";
  if (path === "/staff/me" || path === "/auth/me" || path === "/experts" || path === "/experts/" || path === "/counties" || path.startsWith("/counties/") || path === "/farmer-crops" || path === "/farmer-crops/" || path === "/farmer-livestock" || path === "/farmer-livestock/" || path.startsWith("/market-prices/") || path === "/market-prices" || path === "/market-prices/" || path.startsWith("/advisories/") || path === "/advisories" || path === "/advisories/" || path.startsWith("/products/") || path === "/products" || path === "/products/" || path === "/notifications" || path === "/notifications/" || path === "/recommendations" || path === "/recommendations/" || path === "/recommendations/environment" || /^\/recommendations\/[0-9a-f-]+$/i.test(path)) return verb === "GET";
  if (/^\/vendors\/[0-9a-f-]+\/events$/i.test(path) || path === "/notifications/mark-all-read") return verb === "POST";
  if (/^\/notifications\/[0-9a-f-]+\/read$/i.test(path)) return verb === "PATCH";
  if (path === "/vendors" || path === "/outbreak-alerts/nearby" || path === "/notifications/unread-count" || /^\/vendors\/[0-9a-f-]+(?:\/products)?$/i.test(path)) return verb === "GET";
  if (path === "/crops" || path === "/livestock" || path === "/weather" || path === "/farmers/me/expert-requests" || /^\/farmers\/me\/expert-requests\/[0-9a-f-]+$/i.test(path)) return verb === "GET";
  if (/^\/farmers\/me\/expert-requests\/[0-9a-f-]+\/(?:cancel|feedback)$/i.test(path)) return verb === "POST";
  if (path === "/farmers/me") return ["GET", "PUT", "DELETE"].includes(verb);
  if (path === "/farmers/change-pin") return verb === "PUT";
  if (path === "/staff/me" || path === "/experts/me" || path === "/experts/me/requests") return verb === "GET";
  if (path === "/experts/me/availability" || /^\/experts\/me\/requests\/[0-9a-f-]+$/i.test(path)) return verb === "PATCH";
  if (path === "/expert-request/status") return verb === "PATCH";
  if (/^\/(?:farmer-crops|farmer-livestock)\/[0-9a-f-]+$/i.test(path)) return verb === "DELETE";
  if (/^\/recommendations\/[0-9a-f-]+\/sms$/i.test(path)) return verb === "POST";
  if (path === "/recommendations/generate" || path === "/recommendations/jobs") return verb === "POST";
  if (/^\/recommendations\/jobs\/[0-9a-f-]+$/i.test(path)) return verb === "GET";
  if (/^\/market-prices\/(?:county|crop)\/[0-9a-f-]+$/i.test(path)) return verb === "GET";
  if (/^\/products\/category\/[^/]+$/i.test(path) || /^\/products\/[0-9a-f-]+$/i.test(path) || /^\/advisories\/(?:county|category)\/[^/]+$/i.test(path) || /^\/advisories\/[0-9a-f-]+$/i.test(path)) return verb === "GET";
  return false;
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
