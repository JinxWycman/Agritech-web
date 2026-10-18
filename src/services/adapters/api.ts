import {
  api,
  farmerApi,
  getFarmerProfile,
  listCounties,
  getSavedRecommendations,
  generateRecommendation,
  getAccessToken,
  getFarmerAccessToken,
  loginFarmer,
  loginStaff,
  logoutFarmer,
  logoutStaff,
  type Page,
} from "@/lib/api";
import { ApiError } from "@/lib/http";
import type { ExpertRequestRecord, RequestStatus } from "@/lib/request-lifecycle";
import { SYMPTOM_CATALOGUE } from "@/lib/symptoms";
import type { Vendor, VendorProduct, VendorWithDistance } from "@/types/business";
import type { AdminSummary, Expert, ExpertQueueSummary, FarmerDashboardSummary } from "@/types/domain";
import type { AuthService, AdminSummaryService, ExpertRequestService, ExpertsService, FarmerService, LifecycleExpertRequestService, LifecycleExpertsService, RecommendationService, RequestSettingsService, SymptomsService, VendorService } from "@/services/contracts";

export function mapBackendStaffRole(role: string): "admin" | "expert" {
  if (role === "platform_admin") return "admin";
  if (role === "officer") return "expert";
  throw new ApiError("This account cannot open the staff portal.", 403);
}

export const apiAuthService: AuthService = {
  async loginFarmer(phone, pin) {
    await loginFarmer(phone, pin);
    document.cookie = "farmer_role=farmer; Path=/; SameSite=Lax";
    return { role: "farmer" };
  },
  async loginStaff(phone, password) {
    const result = await loginStaff(phone, password);
    return { role: mapBackendStaffRole(result.role) };
  },
  async continueAs() {
    throw new Error("Demo personas are only available in mock mode.");
  },
  async logout() {
    if (getAccessToken()) await logoutStaff();
    else logoutFarmer();
    document.cookie = "farmer_role=; Path=/; Max-Age=0; SameSite=Lax";
  },
};

export const apiFarmerService: FarmerService = {
  async getDashboardSummary(): Promise<FarmerDashboardSummary> {
    const [farmer, counties] = await Promise.all([getFarmerProfile(), listCounties()]);
    const countyName = counties.find((county) => county.id === farmer.county_id)?.name ?? farmer.county_id;
    return {
      farmer: {
        id: farmer.id,
        name: farmer.full_name,
        phone: farmer.phone_number,
        county: countyName,
        active: farmer.is_active,
      },
    };
  },
};

type RawOverview = {
  farmers_total: number;
  farmers_7d: number;
  active_paid_subscriptions: number;
  failed_payments_7d: number;
  requests_by_status: Record<string, number>;
  requests_aging_48h: number;
  advisories_active: number;
  sms_sessions_open: number;
};

export const apiAdminSummaryService: AdminSummaryService = {
  async getOverview(): Promise<AdminSummary> {
    const data = await api<RawOverview>("/admin/overview");
    return {
      farmersTotal: data.farmers_total,
      farmersLast7Days: data.farmers_7d,
      activePaidSubscriptions: data.active_paid_subscriptions,
      failedPaymentsLast7Days: data.failed_payments_7d,
      requestsByStatus: data.requests_by_status,
      requestsAging48Hours: data.requests_aging_48h,
      advisoriesActive: data.advisories_active,
      smsSessionsOpen: data.sms_sessions_open,
    };
  },
};

export const apiExpertRequestService: ExpertRequestService = {
  async getQueueSummary(): Promise<ExpertQueueSummary> {
    type BackendRequest = { id: string; status: "Pending" | "Accepted" | "Completed"; issue_type: string; farmer_id: string };
    const [pending, accepted, completed] = await Promise.all([
      api<Page<BackendRequest>>("/admin/expert-requests?status=Pending&limit=6&offset=0"),
      api<Page<BackendRequest>>("/admin/expert-requests?status=Accepted&limit=6&offset=0"),
      api<Page<BackendRequest>>("/admin/expert-requests?status=Completed&limit=1&offset=0"),
    ]);
    return {
      pending: pending.items.map((row) => ({
        id: row.id,
        status: "Pending",
        issueType: row.issue_type,
      })),
      accepted: accepted.items.map((row) => ({
        id: row.id,
        status: "Accepted",
        issueType: row.issue_type,
      })),
      completed: completed.total,
    };
  },
};

export const apiExpertsService: ExpertsService = {
  async listAvailable(): Promise<Expert[]> {
    const result = await api<Page<{
      id: string;
      full_name: string;
      phone_number: string;
      expert_type: string;
      county_id: string;
      organization: string;
      is_available: boolean;
    }>>("/admin/experts?is_available=true&limit=50&offset=0");
    return result.items.map((row) => ({
      id: row.id,
      name: row.full_name,
      phone: row.phone_number,
      expertType: row.expert_type,
      county: row.county_id,
      organization: row.organization,
      available: row.is_available,
    }));
  },
};

function lifecycleNotImplemented(resource: string): never {
  throw new Error(`${resource} API adapter is not implemented until its backend contract is confirmed.`);
}

type BackendFarmerRequest = {
  id: string;
  farmer_id: string;
  expert_id: string | null;
  issue_type: string;
  description: string;
  status: string;
  preferred_visit_date: string | null;
  created_at: string;
  updated_at: string;
  request_code: string;
  farmer_resolution: string | null;
  symptom_codes?: string[] | null;
  urgency?: string | null;
  expert: { id: string; full_name: string; phone_number: string | null } | null;
};

/** Project a farmer-owned backend request onto the lifecycle record the screens use. */
export function mapFarmerRequest(row: BackendFarmerRequest): ExpertRequestRecord {
  return {
    id: row.id,
    referenceCode: row.request_code,
    status: row.status.toLowerCase() as RequestStatus,
    issueType: row.issue_type.toLowerCase().startsWith("livestock") ? "livestock" : "crop",
    symptomCodes: row.symptom_codes ?? [],
    urgency: (row.urgency as ExpertRequestRecord["urgency"] | null | undefined) ?? "general_advice",
    note: row.description,
    preferredTime: row.preferred_visit_date ?? "",
    channel: "web",
    farmerId: row.farmer_id,
    farmerName: "",
    farmerPhone: "",
    farmerCounty: "",
    farmerFarm: null,
    farmerCrops: [],
    farmerLivestock: [],
    assignedExpertId: row.expert_id,
    expertPhone: row.expert?.phone_number ?? null,
    offeredExpertIds: [],
    offerExpiresAt: null,
    createdAt: Date.parse(row.created_at),
    updatedAt: Date.parse(row.updated_at),
    expertNotes: [],
    declineReasons: [],
    solved: row.farmer_resolution === "solved" ? true : row.farmer_resolution === "unsolved" ? false : null,
  };
}

const FARMER_REQUESTS = "/farmers/me/expert-requests";

export const apiLifecycleExpertRequestService: LifecycleExpertRequestService = {
  async listForFarmer() {
    const page = await farmerApi<Page<BackendFarmerRequest>>(`${FARMER_REQUESTS}?limit=100&offset=0`);
    return page.items.map(mapFarmerRequest);
  },
  async listOffers() { return lifecycleNotImplemented("Expert offers"); },
  async listCases() { return lifecycleNotImplemented("Expert cases"); },
  async listAll() { return lifecycleNotImplemented("Admin expert-request board"); },
  async getForFarmer(id) {
    try {
      return mapFarmerRequest(await farmerApi<BackendFarmerRequest>(`${FARMER_REQUESTS}/${encodeURIComponent(id)}`));
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },
  async getForExpert() { return lifecycleNotImplemented("Expert case details"); },
  async getForAdmin() { return lifecycleNotImplemented("Admin expert-request details"); },
  async submit(input) {
    // Symptoms and urgency are structured (they feed outbreak signals); the
    // preferred time has no field yet, so it stays readable in the description.
    const description = [
      input.note.trim(),
      input.preferredTime ? `Preferred time: ${input.preferredTime}` : "",
    ].filter(Boolean).join("\n") || input.symptomCodes.join(", ") || input.issueType;
    const created = await farmerApi<Omit<BackendFarmerRequest, "expert">>("/expert-request", {
      method: "POST",
      body: JSON.stringify({ issue_type: input.issueType, description, symptom_codes: input.symptomCodes, urgency: input.urgency }),
    });
    return { ...mapFarmerRequest({ ...created, expert: null }), preferredTime: input.preferredTime };
  },
  async accept() { return lifecycleNotImplemented("Expert offer acceptance"); },
  async decline() { return lifecycleNotImplemented("Expert offer decline"); },
  async cancel(id) {
    return mapFarmerRequest(await farmerApi<BackendFarmerRequest>(`${FARMER_REQUESTS}/${encodeURIComponent(id)}/cancel`, { method: "POST" }));
  },
  async complete() { return lifecycleNotImplemented("Expert case completion"); },
  async escalate() { return lifecycleNotImplemented("Expert case escalation"); },
  async saveFeedback(id, _farmerId, solved) {
    return mapFarmerRequest(await farmerApi<BackendFarmerRequest>(`${FARMER_REQUESTS}/${encodeURIComponent(id)}/feedback`, {
      method: "POST",
      body: JSON.stringify({ solved }),
    }));
  },
  async reassign() { return lifecycleNotImplemented("Admin expert reassignment"); },
  async scoreCandidates() { return lifecycleNotImplemented("Expert assignment scoring"); },
};

export const apiLifecycleExpertsService: LifecycleExpertsService = {
  async listAll() { return apiExpertsService.listAvailable(); },
  async setAvailability(_expertId, available) {
    const row = await api<{
      id: string;
      full_name: string;
      phone_number: string;
      expert_type: string;
      county_id: string;
      organization: string;
      is_available: boolean;
    }>("/admin/me/availability", {
      method: "PATCH",
      body: JSON.stringify({ is_available: available }),
    });
    return {
      id: row.id,
      name: row.full_name,
      phone: row.phone_number,
      expertType: row.expert_type,
      county: row.county_id,
      organization: row.organization,
      available: row.is_available,
    };
  },
  getActingExpertId() { return lifecycleNotImplemented("Demo expert selection"); },
  setActingExpertId() { return lifecycleNotImplemented("Demo expert selection"); },
};

export const apiSymptomsService: SymptomsService = {
  async list(issueType) { return SYMPTOM_CATALOGUE.filter((symptom) => symptom.issueType === issueType); },
};

export const apiRequestSettingsService: RequestSettingsService = {
  async get() { return lifecycleNotImplemented("Expert-request settings"); },
  async update() { return lifecycleNotImplemented("Expert-request settings update"); },
};

export const apiRecommendationService: RecommendationService = {
  async listSaved() { return getSavedRecommendations(); },
  async generate(kind, answers) { return generateRecommendation(kind, answers); },
  async getForFarm() { return null; },
};

type BackendVendor = {
  id: string; name: string; county: string | null; latitude: number | null; longitude: number | null;
  phone: string | null; whatsapp: string | null; certified: boolean; sponsored: boolean; categories: string[];
  opening_hours_text: string | null; opening_hours: Record<string, { open: string; close: string } | null> | null;
  distance_km: number | null;
};
type BackendVendorProduct = {
  id: string; vendor_id: string; name: string; category: string; price_kes: number | null; unit: string;
  stock_status: VendorProduct["stockStatus"];
};

/** Backend listings are single-language; show the same text in both locales. */
export function mapVendor(row: BackendVendor): VendorWithDistance {
  const openingHours: Vendor["openingHours"] = {};
  for (const [day, interval] of Object.entries(row.opening_hours ?? {})) openingHours[Number(day)] = interval;
  return {
    id: row.id,
    name: { en: row.name, sw: row.name },
    // No coordinates: (0,0) lies outside Kenya, so the map skips it; the backend sorts it last.
    location: { latitude: row.latitude ?? 0, longitude: row.longitude ?? 0 },
    county: row.county ?? "",
    phone: row.phone ?? "",
    whatsapp: row.whatsapp ?? "",
    openingHours,
    openingHoursText: row.opening_hours_text,
    rating: null,
    certified: row.certified,
    sponsored: row.sponsored,
    categories: row.categories,
    distanceKm: row.distance_km,
  };
}

export function mapVendorProduct(row: BackendVendorProduct): VendorProduct {
  return {
    id: row.id, vendorId: row.vendor_id, name: { en: row.name, sw: row.name }, category: row.category,
    priceKES: row.price_kes, unit: { en: row.unit, sw: row.unit }, stockStatus: row.stock_status,
  };
}

export const apiVendorService: VendorService = {
  async list(filters, point) {
    const params = new URLSearchParams({ limit: "100", offset: "0" });
    if (filters.text?.trim()) params.set("q", filters.text.trim());
    if (filters.county) params.set("county", filters.county);
    if (filters.category) params.set("category", filters.category);
    if (filters.product?.trim()) params.set("product", filters.product.trim());
    if (point) {
      params.set("latitude", String(point.latitude));
      params.set("longitude", String(point.longitude));
    }
    const page = await api<Page<BackendVendor>>(`/vendors?${params}`);
    return page.items.map(mapVendor);
  },
  async getById(id) {
    try {
      return mapVendor(await api<BackendVendor>(`/vendors/${encodeURIComponent(id)}`));
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },
  async getProducts(vendorId) {
    return (await api<BackendVendorProduct[]>(`/vendors/${encodeURIComponent(vendorId)}/products`)).map(mapVendorProduct);
  },
  async recordEvent(vendorId, event) {
    // Sent with the farmer token when signed in so repeat taps are counted once.
    const request = getFarmerAccessToken() ? farmerApi : api;
    return request<{ views: number; contacts: number }>(`/vendors/${encodeURIComponent(vendorId)}/events`, {
      method: "POST",
      body: JSON.stringify({ event }),
    });
  },
};
