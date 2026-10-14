export type UserRole = "farmer" | "expert" | "admin";

/** Proposed UI model; confirm these fields against the backend before API use. */
export type Farm = {
  id: string;
  farmerId: string;
  county: string;
  latitude?: number;
  longitude?: number;
};

export type Crop = { id: string; name: string };
export type Livestock = { id: string; name: string };
/** Proposed frontend model; profile-write fields and completion rules await backend confirmation. */
export type FarmerProfile = {
  farmSizeAcres: number | null;
  crops: string[];
  livestock: string[];
  subCounty: string;
  ward: string;
  latitude: number | null;
  longitude: number | null;
  county: string;
  profile_complete: boolean;
};

/** All snapshot fields are proposed; no farm-conditions endpoint shape is confirmed. */
export type FarmConditionsSnapshot = {
  latitude: number;
  longitude: number;
  currentWeather?: string;
  todayHighC?: number;
  todayLowC?: number;
  forecast: { day: string; condition: string; highC: number; lowC: number }[];
  ndvi?: number;
  ndviNormal?: number;
  rainfallMm?: number;
  rainfallNormalMm?: number;
  rainfallTrend?: "below" | "normal" | "above";
  ndviTrend?: "below" | "normal" | "above";
};

/** Proposed frontend view model mapped from the legacy profile response. */
export type Farmer = {
  id: string;
  name: string;
  phone: string;
  county: string;
  active: boolean;
};

/** Proposed recommendation model; required attributes remain backend-unconfirmed. */
export type Recommendation = {
  id: string;
  itemName: string;
  reasons: string[];
  alternatives: string[];
  confidenceNote: string;
};

/** Status names are confirmed by the product specification; API representation is not. */
export type ExpertRequestStatus = "Pending" | "Offered" | "Accepted" | "Completed" | "Unassigned" | "Escalated";
export type ExpertRequest = {
  id: string;
  status: ExpertRequestStatus;
  issueType: string;
  farmerName?: string;
};

/** Proposed frontend projection of the legacy experts list response. */
export type Expert = {
  id: string;
  name: string;
  phone: string;
  expertType: string;
  county: string;
  organization: string;
  available: boolean;
  /** Proposed scoring inputs; confirm their meaning and source with the backend. */
  workload?: number;
  lastAssignedAt?: number | null;
  responseRate?: number;
  location?: { latitude: number; longitude: number };
};
export type Vendor = { id: string; name: string; county: string };
export type Product = { id: string; name: string; vendorId?: string };
export type MarketPrice = { id: string; crop: string; market: string; price: number; currency: "KES" };
export type Notification = { id: string; message: string; read: boolean };
export type OutbreakSignal = { id: string; area: string; symptom: string; week: string; count: number };

/** Proposed frontend summary shape; response fields require backend confirmation. */
export type AdminSummary = {
  farmersTotal: number;
  farmersLast7Days: number;
  activePaidSubscriptions: number;
  failedPaymentsLast7Days: number;
  requestsByStatus: Record<string, number>;
  requestsAging48Hours: number;
  advisoriesActive: number;
  smsSessionsOpen: number;
};

export type FarmerDashboardSummary = { farmer: Farmer };
export type ExpertQueueSummary = { pending: ExpertRequest[]; accepted: ExpertRequest[]; completed: number };

export type DemoAuthResult = { role: UserRole };

export type DomainContractEvidence = {
  confirmedBySpec: {
    portalRoles: ["farmer", "expert", "admin"];
    expertRequestStatuses: ExpertRequestStatus[];
  };
  proposedFrontendModels: {
    farmer: Farmer;
    farm: Farm;
    recommendation: Recommendation;
    adminSummary: AdminSummary;
  };
};
