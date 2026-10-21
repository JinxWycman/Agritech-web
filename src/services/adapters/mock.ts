import { getDemoScenario, getMockDelayMs } from "@/lib/data-mode";
import { currentDemoExpertId, demoNow, readLifecycleRequests, readRequestStore, setCurrentDemoExpertId, writeRequestStore } from "@/lib/request-store";
import { acceptOffer, cancelRequest, completeRequest, createRequest, declineOffer, escalateRequest, expertMaySeeFarmerPhone, farmerMaySeeExpertPhone, reassignRequest, requestSettingsSchema, saveFarmerFeedback, scoreExpert, type ExpertRequestRecord, type Result } from "@/lib/request-lifecycle";
import { demoAdminSummary, demoExpertQueue, demoExperts, demoFarmerSummary } from "@/mocks/fixtures";
import type { UserRole } from "@/types/domain";
import type { AuthService, AdminSummaryService, ExpertRequestService, ExpertsService, FarmerService, LifecycleExpertRequestService, LifecycleExpertsService, RequestSettingsService, SymptomsService } from "@/services/contracts";
import { resolveScenario } from "@/mocks/scenarios";
import { demoSymptoms } from "@/mocks/fixtures";
import { demoAgroZones, demoCropVarieties, demoLivestockBreeds, demoVendorProducts, demoVendors } from "@/mocks/business-catalogue";
import { buildRecommendations, nearestAgroZone } from "@/lib/recommendations";
import { filterAndSortVendors } from "@/lib/vendor-search";
import type { RecommendationService, VendorService } from "@/services/contracts";
import type { VendorPortalStats } from "@/types/business";

function assertDemoHealthy(): void {
  if (getDemoScenario() === "error") throw new Error("Demo service error scenario.");
}

function demoList<T>(items: T[]): T[] {
  assertDemoHealthy();
  return getDemoScenario() === "empty" ? [] : items;
}

function requireResult<T>(result: Result<T>): T {
  if (!result.ok) throw new Error(`Invalid expert-request transition: ${result.error}.`);
  return result.value;
}

function updateRequest(id: string, action: (request: ExpertRequestRecord, now: number) => ExpertRequestRecord): ExpertRequestRecord {
  const now = demoNow();
  const requests = readLifecycleRequests(() => now);
  const request = requests.find((item) => item.id === id);
  if (!request) throw new Error("Expert request was not found.");
  const updated = action(request, now);
  const store = readRequestStore();
  const wasActive = request.status === "accepted";
  const isActive = updated.status === "accepted";
  const experts = store.experts.map((expert) => {
    if (expert.id !== updated.assignedExpertId && expert.id !== request.assignedExpertId) return expert;
    if (expert.id === updated.assignedExpertId && !wasActive && isActive) return { ...expert, workload: (expert.workload ?? 0) + 1, lastAssignedAt: now };
    if (expert.id === request.assignedExpertId && wasActive && !isActive) return { ...expert, workload: Math.max(0, (expert.workload ?? 0) - 1) };
    return expert;
  });
  writeRequestStore({ ...store, experts, requests: requests.map((item) => item.id === id ? updated : item) });
  return updated;
}

function farmerView(request: ExpertRequestRecord): ExpertRequestRecord {
  const assigned = readRequestStore().experts.find((expert) => expert.id === request.assignedExpertId);
  return { ...request, expertPhone: farmerMaySeeExpertPhone(request) ? assigned?.phone ?? null : null };
}
function expertView(request: ExpertRequestRecord, expertId: string): ExpertRequestRecord {
  return { ...request, farmerPhone: expertMaySeeFarmerPhone(request, expertId) ? request.farmerPhone : "" };
}
function adminView(request: ExpertRequestRecord): ExpertRequestRecord {
  const assigned = readRequestStore().experts.find((expert) => expert.id === request.assignedExpertId);
  return { ...request, expertPhone: assigned?.phone ?? null };
}

export const mockLifecycleExpertRequestService: LifecycleExpertRequestService = {
  async listForFarmer(farmerId) { await delay(); return demoList(readLifecycleRequests().filter((request) => request.farmerId === farmerId).map(farmerView)); },
  async listOffers(expertId) { await delay(); return demoList(readLifecycleRequests().filter((request) => request.status === "offered" && request.assignedExpertId === expertId).map((request) => expertView(request, expertId))); },
  async listCases(expertId) { await delay(); return demoList(readLifecycleRequests().filter((request) => ["accepted", "completed"].includes(request.status) && request.assignedExpertId === expertId).map((request) => expertView(request, expertId))); },
  async listAll() { await delay(); return demoList(readLifecycleRequests().map(adminView)); },
  async getForFarmer(id, farmerId) { await delay(); assertDemoHealthy(); if (getDemoScenario() === "empty") return null; const item = readLifecycleRequests().find((request) => request.id === id && request.farmerId === farmerId); return item ? farmerView(item) : null; },
  async getForExpert(id, expertId) { await delay(); assertDemoHealthy(); if (getDemoScenario() === "empty") return null; const item = readLifecycleRequests().find((request) => request.id === id && request.assignedExpertId === expertId); return item ? expertView(item, expertId) : null; },
  async getForAdmin(id) { await delay(); assertDemoHealthy(); if (getDemoScenario() === "empty") return null; const item = readLifecycleRequests().find((request) => request.id === id); return item ? adminView(item) : null; },
  async submit(input) {
    assertDemoHealthy();
    const store = readRequestStore();
    const sequence = store.sequence + 1;
    const request = createRequest(input, store.experts, store.settings, demoNow(), sequence);
    writeRequestStore({ ...store, sequence, requests: [...store.requests, request] });
    return request;
  },
  async accept(id, expertId) { assertDemoHealthy(); return updateRequest(id, (request, now) => requireResult(acceptOffer(request, expertId, now))); },
  async decline(id, expertId, reason) {
    assertDemoHealthy();
    const store = readRequestStore();
    return updateRequest(id, (request, now) => requireResult(declineOffer(request, expertId, reason, store.experts, store.settings, now)));
  },
  async cancel(id, farmerId) { assertDemoHealthy(); return updateRequest(id, (request, now) => requireResult(cancelRequest(request, farmerId, now))); },
  async complete(id, expertId, note) { assertDemoHealthy(); return updateRequest(id, (request, now) => requireResult(completeRequest(request, expertId, note, now))); },
  async escalate(id, expertId, note) { assertDemoHealthy(); return updateRequest(id, (request, now) => requireResult(escalateRequest(request, expertId, note, now))); },
  async saveFeedback(id, farmerId, solved) { assertDemoHealthy(); return updateRequest(id, (request, now) => requireResult(saveFarmerFeedback(request, farmerId, solved, now))); },
  async reassign(id, expertId) {
    assertDemoHealthy();
    const store = readRequestStore();
    const expert = store.experts.find((item) => item.id === expertId);
    if (!expert) throw new Error("Selected expert was not found.");
    return updateRequest(id, (request, now) => requireResult(reassignRequest(request, expert, store.settings, now)));
  },
  async scoreCandidates(id) {
    assertDemoHealthy();
    const request = readLifecycleRequests().find((item) => item.id === id);
    if (!request) throw new Error("Expert request was not found.");
    const store = readRequestStore();
    return store.experts.map((expert) => scoreExpert(expert, request.farmerFarm, store.settings, demoNow()));
  },
};

export const mockLifecycleExpertsService: LifecycleExpertsService = {
  async listAll() { await delay(); assertDemoHealthy(); return readRequestStore().experts; },
  async setAvailability(expertId, available) {
    assertDemoHealthy();
    const store = readRequestStore();
    const experts = store.experts.map((expert) => expert.id === expertId ? { ...expert, available } : expert);
    const updated = experts.find((expert) => expert.id === expertId);
    if (!updated) throw new Error("Expert was not found.");
    writeRequestStore({ ...store, experts });
    return updated;
  },
  getActingExpertId: currentDemoExpertId,
  setActingExpertId: setCurrentDemoExpertId,
};

export const mockSymptomsService: SymptomsService = {
  async list(issueType) { await delay(); assertDemoHealthy(); return demoSymptoms.filter((symptom) => symptom.issueType === issueType); },
};

export const mockRequestSettingsService: RequestSettingsService = {
  async get() { await delay(); assertDemoHealthy(); return readRequestStore().settings; },
  async update(settings) {
    assertDemoHealthy();
    const validated = requestSettingsSchema.parse(settings);
    const store = readRequestStore();
    writeRequestStore({ ...store, settings: validated });
    return validated;
  },
};

const delay = () => new Promise((resolve) => setTimeout(resolve, getMockDelayMs()));

export const mockAuthService: AuthService = {
  async loginFarmer() {
    throw new Error("Use the demo persona picker instead of entering credentials.");
  },
  async loginStaff() {
    throw new Error("Staff credentials are not collected in demo mode.");
  },
  async continueAs(role: UserRole) {
    await delay();
    return { role };
  },
  async logout() {
    if (typeof document !== "undefined") {
      document.cookie = "demo_role=; Path=/; Max-Age=0; SameSite=Lax";
    }
  },
};

export const mockFarmerService: FarmerService = {
  async getDashboardSummary() {
    await delay();
    const scenario = getDemoScenario();
    if (scenario === "empty") return { farmer: { id: "", name: "", phone: "", county: "", active: false } };
    return resolveScenario(scenario, demoFarmerSummary, demoFarmerSummary);
  },
};

export const mockExpertRequestService: ExpertRequestService = {
  async getQueueSummary() {
    await delay();
    const scenario = getDemoScenario();
    if (scenario === "empty") return { pending: [], accepted: [], completed: 0 };
    return resolveScenario(scenario, demoExpertQueue, demoExpertQueue);
  },
};

export const mockExpertsService: ExpertsService = {
  async listAvailable() {
    await delay();
    const scenario = getDemoScenario();
    if (scenario === "empty") return [];
    return resolveScenario(scenario, demoExperts, []);
  },
};

export const mockAdminSummaryService: AdminSummaryService = {
  async getOverview() {
    await delay();
    const scenario = getDemoScenario();
    if (scenario === "empty") {
      return {
        farmersTotal: 0,
        farmersLast7Days: 0,
        activePaidSubscriptions: 0,
        failedPaymentsLast7Days: 0,
        requestsByStatus: {},
        requestsAging48Hours: 0,
        advisoriesActive: 0,
        smsSessionsOpen: 0,
      };
    }
    return resolveScenario(scenario, demoAdminSummary, demoAdminSummary);
  },
};

export const DEMO_VENDOR_EVENTS_KEY = "agritech_demo_vendor_events_v1";

type VendorEventStore = Record<string, VendorPortalStats>;

function readVendorEvents(): VendorEventStore {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(DEMO_VENDOR_EVENTS_KEY);
  if (!raw) return {};
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Demo vendor event data is invalid. Reset demo data to continue.");
  }
  for (const value of Object.values(parsed)) {
    if (!value || typeof value !== "object" || !Number.isInteger(value.views) || !Number.isInteger(value.contacts)) {
      throw new Error("Demo vendor event counts are invalid. Reset demo data to continue.");
    }
  }
  return parsed as VendorEventStore;
}

function assertBusinessSuccess(): void {
  if (getDemoScenario() === "error") throw new Error("Demo service error scenario.");
}

export const mockRecommendationService: RecommendationService = {
  async listSaved() { await delay(); return []; },
  async sendSms() { await delay(); return { status: "queued" }; },
  async generate() { throw new Error("Live SMS recommendations are available when connected to the API."); },
  async getForFarm(kind, point, conditions) {
    await delay();
    assertBusinessSuccess();
    if (getDemoScenario() === "empty") return null;
    const zone = nearestAgroZone(point, demoAgroZones);
    if (!zone) return null;
    const vendors = filterAndSortVendors(demoVendors, demoVendorProducts, {}, point);
    const catalogue = kind === "crop" ? demoCropVarieties : demoLivestockBreeds;
    return {
      zone,
      recommendations: buildRecommendations(kind, catalogue, zone, vendors, demoVendorProducts, conditions),
    };
  },
};

export const mockVendorService: VendorService = {
  async list(filters, point) {
    await delay();
    assertBusinessSuccess();
    if (getDemoScenario() === "empty") return [];
    return filterAndSortVendors(demoVendors, demoVendorProducts, filters, point);
  },
  async getById(id) {
    await delay();
    assertBusinessSuccess();
    if (getDemoScenario() === "empty") return null;
    return demoVendors.find((vendor) => vendor.id === id) ?? null;
  },
  async getProducts(vendorId) {
    await delay();
    assertBusinessSuccess();
    if (getDemoScenario() === "empty") return [];
    return demoVendorProducts.filter((product) => product.vendorId === vendorId);
  },
  async recordEvent(vendorId, event) {
    assertBusinessSuccess();
    if (!demoVendors.some((vendor) => vendor.id === vendorId)) throw new Error("Sample vendor was not found.");
    const all = readVendorEvents();
    const counts = all[vendorId] ?? { views: 0, contacts: 0 };
    const updated = { ...counts, [event === "view" ? "views" : "contacts"]: counts[event === "view" ? "views" : "contacts"] + 1 };
    if (typeof window !== "undefined") window.localStorage.setItem(DEMO_VENDOR_EVENTS_KEY, JSON.stringify({ ...all, [vendorId]: updated }));
    return updated;
  },
};
