import type {
  AdminSummary,
  DemoAuthResult,
  ExpertQueueSummary,
  Expert,
  FarmerProfile,
  FarmConditionsSnapshot,
  FarmerDashboardSummary,
  UserRole,
} from "@/types/domain";

export type AuthService = {
  loginFarmer(phone: string, pin: string): Promise<DemoAuthResult>;
  loginStaff(phone: string, password: string): Promise<DemoAuthResult>;
  continueAs(role: UserRole): Promise<DemoAuthResult>;
  logout(): Promise<void>;
};

export type FarmerService = {
  getDashboardSummary(): Promise<FarmerDashboardSummary>;
};

export type FarmerProfileService = {
  getProfile(): Promise<FarmerProfile | null>;
  saveProfile(profile: Omit<FarmerProfile, "county" | "profile_complete">): Promise<FarmerProfile>;
  resetDemoProfile(): void;
};

export type FarmConditionsService = {
  getSnapshot(latitude: number, longitude: number): Promise<FarmConditionsSnapshot | null>;
};

export type FarmerAlertsService = {
  getUnreadCount(): Promise<number>;
};

export type FarmerRequestsService = {
  getOpenCount(): Promise<number>;
};

import type { ExpertRequestRecord, FarmPoint, RequestSettings, RequestUrgency, ScoredExpert } from "@/lib/request-lifecycle";

export type NewExpertRequestInput = {
  issueType: "crop" | "livestock"; symptomCodes: string[]; urgency: RequestUrgency; note: string; preferredTime: string;
  farmerId: string; farmerName: string; farmerPhone: string; farmerCounty: string; farmerFarm: FarmPoint | null;
  farmerCrops: string[]; farmerLivestock: string[];
};
export type Symptom = { code: string; issueType: "crop" | "livestock" };
export type LifecycleExpertRequestService = {
  listForFarmer(farmerId: string): Promise<ExpertRequestRecord[]>;
  listOffers(expertId: string): Promise<ExpertRequestRecord[]>;
  listCases(expertId: string): Promise<ExpertRequestRecord[]>;
  listAll(): Promise<ExpertRequestRecord[]>;
  getForFarmer(id: string, farmerId: string): Promise<ExpertRequestRecord | null>;
  getForExpert(id: string, expertId: string): Promise<ExpertRequestRecord | null>;
  getForAdmin(id: string): Promise<ExpertRequestRecord | null>;
  submit(input: NewExpertRequestInput): Promise<ExpertRequestRecord>;
  accept(id: string, expertId: string): Promise<ExpertRequestRecord>;
  decline(id: string, expertId: string, reason: string): Promise<ExpertRequestRecord>;
  cancel(id: string, farmerId: string): Promise<ExpertRequestRecord>;
  complete(id: string, expertId: string, note: string): Promise<ExpertRequestRecord>;
  escalate(id: string, expertId: string, note: string): Promise<ExpertRequestRecord>;
  saveFeedback(id: string, farmerId: string, solved: boolean): Promise<ExpertRequestRecord>;
  reassign(id: string, expertId: string): Promise<ExpertRequestRecord>;
  scoreCandidates(id: string): Promise<ScoredExpert[]>;
};
export type LifecycleExpertsService = {
  listAll(): Promise<Expert[]>;
  setAvailability(expertId: string, available: boolean): Promise<Expert>;
  getActingExpertId(): string;
  setActingExpertId(expertId: string): void;
};
export type SymptomsService = { list(issueType: Symptom["issueType"]): Promise<Symptom[]> };
export type RequestSettingsService = { get(): Promise<RequestSettings>; update(settings: RequestSettings): Promise<RequestSettings> };

export type ExpertRequestService = {
  getQueueSummary(): Promise<ExpertQueueSummary>;
};

export type ExpertsService = {
  listAvailable(): Promise<Expert[]>;
};

export type AdminSummaryService = {
  getOverview(): Promise<AdminSummary>;
};

export type ResourceService<T> = {
  list(): Promise<T[]>;
};
