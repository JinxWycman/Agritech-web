/**
 * How the browser talks to FastAPI.
 *
 * Pages call api("/admin/overview") ? never the Render URL directly.
 * Next.js forwards /backend/... to the server-only API_URL. The API checks the JWT.
 * Access token stays in memory. Refresh token stays in an HttpOnly cookie.
 */
import { ApiError, OFFLINE_MESSAGE, formatApiDetail, httpRequest, isStaffRole, safeNextPath } from "@/lib/http";

const PROXY = "/backend";
const REQUEST_TIMEOUT_MS = 12_000;
const ACCESS_KEY = "agritech_staff_access";
const ROLE_KEY = "agritech_staff_role";
const FARMER_KEY = "agritech_farmer_access";

export type Page<T> = {
  items: T[];
  total: number;
  limit: number;
  offset: number;
};

let accessToken: string | null = null;
let farmerAccessToken: string | null = null;
let farmerRefreshToken: string | null = null;
let refreshInFlight: Promise<string | null> | null = null;
let farmerRefreshInFlight: Promise<string | null> | null = null;

const FARMER_REFRESH_KEY = "agritech_farmer_refresh";

function forgetLegacyStorage() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(ACCESS_KEY);
  sessionStorage.removeItem(ROLE_KEY);
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function getFarmerAccessToken(): string | null {
  // Survives page reloads for this browser tab; cleared on sign-out or expiry.
  if (!farmerAccessToken && typeof window !== "undefined") farmerAccessToken = sessionStorage.getItem(FARMER_KEY);
  return farmerAccessToken;
}

export function getStaffRole(): string | null {
  if (typeof window === "undefined") return null;
  return getCookie("staff_role");
}

function writeRoleCookie(role: string) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = "staff_role=" + encodeURIComponent(role) + "; Path=/; Max-Age=" + String(60 * 60 * 24 * 14) + "; SameSite=Lax" + secure;
}

export function setSession(nextAccessToken: string, role: string) {
  if (!isStaffRole(role)) return;
  accessToken = nextAccessToken;
  writeRoleCookie(role);
  writePortalRoleCookie(role === "platform_admin" ? "admin" : "expert");
}

export function setFarmerSession(nextAccessToken: string, nextRefreshToken?: string) {
  farmerAccessToken = nextAccessToken;
  if (typeof window !== "undefined") {
    sessionStorage.setItem(FARMER_KEY, nextAccessToken);
    if (nextRefreshToken) {
      farmerRefreshToken = nextRefreshToken;
      sessionStorage.setItem(FARMER_REFRESH_KEY, nextRefreshToken);
    }
  }
  writePortalRoleCookie("farmer");
}

function getFarmerRefreshToken(): string | null {
  if (!farmerRefreshToken && typeof window !== "undefined") farmerRefreshToken = sessionStorage.getItem(FARMER_REFRESH_KEY);
  return farmerRefreshToken;
}

function writePortalRoleCookie(role: string) {
  if (typeof window === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `portal_role=${encodeURIComponent(role)}; Path=/; Max-Age=${String(60 * 60 * 24 * 14)}; SameSite=Lax${secure}`;
}

export function clearSession() {
  accessToken = null;
  forgetLegacyStorage();
  if (typeof window === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = "staff_role=; Path=/; Max-Age=0; SameSite=Lax" + secure;
  document.cookie = "portal_role=; Path=/; Max-Age=0; SameSite=Lax" + secure;
}

export function clearFarmerSession() {
  farmerAccessToken = null;
  farmerRefreshToken = null;
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(FARMER_KEY);
    sessionStorage.removeItem(FARMER_REFRESH_KEY);
    document.cookie = "farmer_role=; Path=/; Max-Age=0; SameSite=Lax";
    document.cookie = "portal_role=; Path=/; Max-Age=0; SameSite=Lax";
  }
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

async function readDetail(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as { detail?: unknown };
    return formatApiDetail(body.detail, fallback);
  } catch {
    return fallback || response.statusText || "Request failed";
  }
}

async function timedFetch(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await httpRequest(url, {
      ...init,
      signal: init.signal ?? controller.signal,
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(OFFLINE_MESSAGE, 0);
  } finally {
    clearTimeout(timer);
  }
}

async function refreshAccess(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    let response: Response;
    try {
      response = await timedFetch(PROXY + "/staff/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
    } catch {
      return null;
    }
    if (!response.ok) return null;
    const data = (await response.json()) as { access_token?: string; role?: string };
    if (!data.access_token || !isStaffRole(data.role)) return null;
    setSession(data.access_token, data.role);
    return data.access_token;
  })().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

export async function bootstrapSession(): Promise<string | null> {
  forgetLegacyStorage();
  if (accessToken) return accessToken;
  if (typeof window !== "undefined" && !getCookie("staff_role")) return null;
  return refreshAccess();
}

function expireSession() {
  clearSession();
  if (typeof window === "undefined" || window.location.pathname === "/login") return;
  const next = safeNextPath(window.location.pathname + window.location.search);
  window.location.assign(next ? "/login?next=" + encodeURIComponent(next) : "/login");
}

export async function api<T>(path: string, options: RequestInit = {}, retried = false): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  const token = getAccessToken();
  if (token) headers.set("Authorization", "Bearer " + token);

  let response: Response;
  try {
    response = await timedFetch(PROXY + path, { ...options, headers });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(OFFLINE_MESSAGE, 0);
  }

  if (response.status === 401 && !retried && path !== "/staff/refresh") {
    const next = await refreshAccess();
    if (next) return api<T>(path, options, true);
    expireSession();
    throw new ApiError("Session expired. Sign in again.", 401);
  }

  if (!response.ok) {
    const fallback = response.statusText || "Request failed";
    throw new ApiError(await readDetail(response, fallback), response.status);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function loginStaff(phone_number: string, password: string) {
  let response: Response;
  try {
    response = await timedFetch(PROXY + "/staff/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone_number, password }),
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(OFFLINE_MESSAGE, 0);
  }
  if (!response.ok) {
    throw new ApiError(await readDetail(response, "Login failed"), response.status);
  }
  const data = (await response.json()) as { access_token: string; role: string };
  if (!isStaffRole(data.role) || !data.access_token) {
    throw new ApiError("This account cannot open the staff console.", 403);
  }
  setSession(data.access_token, data.role);
  return data;
}

export async function logoutStaff() {
  try {
    await timedFetch(PROXY + "/staff/logout", { method: "POST" });
  } catch {
    /* still clear the local session */
  }
  clearSession();
}

export async function loginFarmer(phone_number: string, pin: string) {
  let response: Response;
  try {
    response = await timedFetch(PROXY + "/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone_number, pin }),
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(OFFLINE_MESSAGE, 0);
  }

  if (!response.ok) {
    throw new ApiError(await readDetail(response, "Login failed"), response.status);
  }

  const data = (await response.json()) as { access_token?: string; refresh_token?: string; token_type?: string; expires_in?: number; role?: string };
  if (!data.access_token) {
    throw new ApiError("This account cannot open the farmer portal.", 403);
  }

  setFarmerSession(data.access_token, data.refresh_token);
  return data;
}

export type County = { id: string; name: string; latitude: number; longitude: number };
export type FarmerRegistration = {
  full_name: string;
  national_id: string;
  phone_number: string;
  pin: string;
  county_id: string;
  constituency_id?: string | null;
  ward_id?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type Constituency = { id: string; name: string; county_id: string; latitude: number; longitude: number };
export type Ward = { id: string; name: string; constituency_id: string };
export type LocationMatch = { county: County; constituency: Constituency; wards: Ward[]; distance_km: number; approximate: boolean };
export type CatalogueItem = { id: string; name: string };

export async function listCounties(): Promise<County[]> {
  return api<County[]>("/counties");
}

export async function listConstituencies(countyId: string): Promise<Constituency[]> {
  return api<Constituency[]>(`/counties/${encodeURIComponent(countyId)}/constituencies`);
}

export async function listWards(constituencyId: string): Promise<Ward[]> {
  return api<Ward[]>(`/counties/constituencies/${encodeURIComponent(constituencyId)}/wards`);
}

/** Nearest county and sub-county for a point; approximate (centroid based). */
export async function locateCoordinates(latitude: number, longitude: number): Promise<LocationMatch> {
  return api<LocationMatch>(`/counties/locate?latitude=${latitude}&longitude=${longitude}`);
}

export async function listCropCatalogue(): Promise<CatalogueItem[]> {
  return api<CatalogueItem[]>("/crops");
}

export async function listLivestockCatalogue(): Promise<CatalogueItem[]> {
  return api<CatalogueItem[]>("/livestock");
}

export async function registerFarmer(payload: FarmerRegistration): Promise<FarmerProfile> {
  return api<FarmerProfile>("/farmers/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export type FarmerProfile = {
  id: string;
  full_name: string;
  national_id: string;
  phone_number: string;
  county_id: string;
  constituency_id: string | null;
  ward_id: string | null;
  latitude: number | null;
  longitude: number | null;
  sub_county: string | null;
  ward: string | null;
  is_active: boolean;
};

export type ExpertSummary = {
  id: string;
  full_name: string;
  phone_number: string;
  expert_type: string;
  county_id: string;
  organization: string;
  is_available: boolean;
};

export type ExpertListResponse = {
  items: ExpertSummary[];
  total: number;
  limit?: number;
  offset: number;
};

export type ExpertRequestPayload = {
  farmer_id: string;
  expert_id: string;
  issue_type: string;
  description: string;
  preferred_visit_date: string | null;
};

export type ExpertRequestResponse = {
  id: string;
  farmer_id: string;
  expert_id: string;
  issue_type: string;
  description: string;
  status: string;
  preferred_visit_date: string | null;
  created_at: string;
  updated_at: string;
};

export function buildExpertRequestPayload({
  farmer_id,
  expert_id,
  issue_type,
  description,
  preferred_visit_date,
}: {
  farmer_id: string;
  expert_id: string;
  issue_type: string;
  description: string;
  preferred_visit_date: string | null;
}): ExpertRequestPayload {
  const normalizedIssue = issue_type.trim();
  const normalizedDescription = description.trim();
  const value = preferred_visit_date ? preferred_visit_date + "T12:00:00Z" : null;
  return {
    farmer_id,
    expert_id,
    issue_type: normalizedIssue,
    description: normalizedDescription,
    preferred_visit_date: value ? new Date(value).toISOString() : null,
  };
}

async function refreshFarmerAccess(): Promise<string | null> {
  if (farmerRefreshInFlight) return farmerRefreshInFlight;
  farmerRefreshInFlight = (async () => {
    const token = getFarmerRefreshToken();
    if (!token) return null;
    let response: Response;
    try {
      response = await timedFetch(PROXY + "/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: token }),
      });
    } catch {
      return null;
    }
    if (!response.ok) return null;
    const data = (await response.json()) as { access_token?: string; refresh_token?: string };
    if (!data.access_token) return null;
    setFarmerSession(data.access_token, data.refresh_token);
    return data.access_token;
  })().finally(() => {
    farmerRefreshInFlight = null;
  });
  return farmerRefreshInFlight;
}

export async function farmerApi<T>(path: string, options: RequestInit = {}, retried = false): Promise<T> {
  const token = getFarmerAccessToken();
  if (!token) {
    clearFarmerSession();
    expireSession();
    throw new ApiError("Please sign in to continue.", 401);
  }

  const headers = new Headers(options.headers);
  headers.set("Authorization", "Bearer " + token);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await timedFetch(PROXY + path, { ...options, headers });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(OFFLINE_MESSAGE, 0);
  }

  if (response.status === 401 && !retried) {
    const next = await refreshFarmerAccess();
    if (next) return farmerApi<T>(path, options, true);
    clearFarmerSession();
    expireSession();
    throw new ApiError("Session expired. Sign in again.", 401);
  }

  if (!response.ok) {
    const fallback = response.statusText || "Request failed";
    throw new ApiError(await readDetail(response, fallback), response.status);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function getFarmerProfile() {
  return farmerApi<FarmerProfile>("/farmers/me");
}

export async function getSavedRecommendations() {
  return farmerApi<import("@/services/contracts").LiveRecommendation[]>("/recommendations/");
}

type RecommendationJob = {
  job_id: string;
  status: "queued" | "running" | "done" | "failed";
  error?: string;
} & Partial<import("@/services/contracts").GeneratedLiveRecommendation>;

const JOB_POLL_MS = 2000;
const JOB_TIMEOUT_MS = 120_000;

/**
 * AI generation takes several seconds, so the backend queues it as a job;
 * poll until it finishes and return the same shape as the old direct call.
 */
export async function generateRecommendation(
  kind: "crop" | "livestock",
  answers: Record<string, string | number | boolean | null>,
  wait: (ms: number) => Promise<void> = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
) {
  const started = await farmerApi<RecommendationJob>("/recommendations/jobs", {
    method: "POST",
    body: JSON.stringify({ kind, answers }),
  });
  const deadline = Date.now() + JOB_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await wait(JOB_POLL_MS);
    const job = await farmerApi<RecommendationJob>(`/recommendations/jobs/${encodeURIComponent(started.job_id)}`);
    if (job.status === "done" && job.recommendation) {
      return { recommendation: job.recommendation, sms: job.sms } as import("@/services/contracts").GeneratedLiveRecommendation;
    }
    if (job.status === "failed") throw new ApiError(job.error || "Could not generate a recommendation.", 422);
  }
  throw new ApiError("The recommendation is taking longer than expected. Check your saved recommendations shortly.", 504);
}

export async function getExperts(
  params: { county_id?: string; expert_type?: string; is_available?: boolean; limit?: number; offset?: number } = {},
) {
  const query = new URLSearchParams();
  if (params.county_id) query.set("county_id", params.county_id);
  if (params.expert_type) query.set("expert_type", params.expert_type);
  if (typeof params.is_available === "boolean") query.set("is_available", String(params.is_available));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.offset) query.set("offset", String(params.offset));
  const suffix = query.size ? "?" + query.toString() : "";
  return farmerApi<ExpertListResponse>("/experts/" + suffix);
}

export async function createExpertRequest(payload: ExpertRequestPayload) {
  return farmerApi<ExpertRequestResponse>("/expert-request", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function logoutFarmer() {
  clearFarmerSession();
}

export { ApiError };
