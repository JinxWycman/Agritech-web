import {
  api,
  getFarmerProfile,
  getSavedRecommendations,
  generateRecommendation,
  getAccessToken,
  loginFarmer,
  loginStaff,
  logoutFarmer,
  logoutStaff,
  type Page,
} from "@/lib/api";
import { ApiError } from "@/lib/http";
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
    const farmer = await getFarmerProfile();
    return {
      farmer: {
        id: farmer.id,
        name: farmer.full_name,
        phone: farmer.phone_number,
        county: farmer.county_id,
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

export const apiLifecycleExpertRequestService: LifecycleExpertRequestService = {
  async listForFarmer() { return lifecycleNotImplemented("Farmer expert-request lifecycle"); },
  async listOffers() { return lifecycleNotImplemented("Expert offers"); },
  async listCases() { return lifecycleNotImplemented("Expert cases"); },
  async listAll() { return lifecycleNotImplemented("Admin expert-request board"); },
  async getForFarmer() { return lifecycleNotImplemented("Farmer expert-request details"); },
  async getForExpert() { return lifecycleNotImplemented("Expert case details"); },
  async getForAdmin() { return lifecycleNotImplemented("Admin expert-request details"); },
  async submit() { return lifecycleNotImplemented("Expert-request lifecycle submission"); },
  async accept() { return lifecycleNotImplemented("Expert offer acceptance"); },
  async decline() { return lifecycleNotImplemented("Expert offer decline"); },
  async cancel() { return lifecycleNotImplemented("Expert-request cancellation"); },
  async complete() { return lifecycleNotImplemented("Expert case completion"); },
  async escalate() { return lifecycleNotImplemented("Expert case escalation"); },
  async saveFeedback() { return lifecycleNotImplemented("Farmer case feedback"); },
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
  async list() { return lifecycleNotImplemented("Expert-request symptom catalogue"); },
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

export const apiVendorService: VendorService = {
  async list() { return lifecycleNotImplemented("Vendor directory and filters"); },
  async getById() { return lifecycleNotImplemented("Vendor profile"); },
  async getProducts() { return lifecycleNotImplemented("Vendor product offers"); },
  async recordEvent() { return lifecycleNotImplemented("Vendor view and contact events"); },
};
