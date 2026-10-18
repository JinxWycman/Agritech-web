import type { Coordinates } from "@/lib/kenya-location";

export type LocalizedText = { en: string; sw: string };
export function pickLocalized(text: LocalizedText, locale: "en" | "sw"): string {
  return text[locale];
}
export type LocalizedCopyKey = "altitudeFit" | "rainfallFit" | "ndviTrend" | "rainfallTrend";
export type RecommendationReason = {
  key: LocalizedCopyKey;
  params?: Record<string, string | number>;
};

export type Suitability = {
  /** Spec-confirmed attribute; sample numeric ranges are proposed placeholders. */
  altitudeM: { min: number; max: number };
  /** Spec-confirmed attribute; sample numeric ranges are proposed placeholders. */
  annualRainfallMm: { min: number; max: number };
};

export type CropVariety = {
  id: string;
  /** Spec-confirmed: recommendations identify a specific variety. */
  name: LocalizedText;
  suitability: Suitability;
  /** Spec-confirmed card field; mock duration is proposed sample content. */
  maturityDays: number;
  /** Spec-confirmed card field; text is sample content pending agronomist review. */
  risks: LocalizedText[];
  /** Spec-confirmed card field; text is sample content pending agronomist review. */
  plantingWindow: LocalizedText;
  /** Spec-confirmed card field; values are proposed sample content. */
  spacing: LocalizedText;
  /** Spec-confirmed recommendation tips; sample content needs agronomist review. */
  intercroppingTips: LocalizedText[];
  /** Spec-confirmed recommendation tips; sample content needs agronomist review. */
  rotationTips: LocalizedText[];
};

export type LivestockBreed = {
  id: string;
  /** Spec-confirmed: recommendations identify a specific breed. */
  name: LocalizedText;
  suitability: Suitability;
  /** Spec-confirmed maturity field; sample duration is proposed. */
  maturityMonths: number;
  /** Spec-confirmed card field; sample content needs agronomist review. */
  risks: LocalizedText[];
  /** Spec-confirmed card field; sample content needs agronomist review. */
  plantingWindow: LocalizedText;
  /** Spec-confirmed card field; values are proposed sample content. */
  stockingDensity: LocalizedText;
  /** Spec-confirmed breed detail; sample content needs agronomist review. */
  feedPlan: LocalizedText[];
  /** Spec-confirmed breed detail; sample content needs agronomist review. */
  housing: LocalizedText[];
  /** Spec-confirmed breed detail; sample content needs agronomist review. */
  vaccinationCalendar: LocalizedText[];
};

export type OpeningHours = {
  /** Sunday is 0 and Saturday is 6; all times use local Kenya time (UTC+3). */
  [weekday: number]: { open: string; close: string } | null;
};

export type Vendor = {
  id: string;
  name: LocalizedText;
  location: Coordinates;
  county: string;
  /** Spec-confirmed contact detail; demo numbers are placeholders. */
  phone: string;
  whatsapp: string;
  /** Spec-confirmed capability; structure is a proposed frontend shape. */
  openingHours: OpeningHours;
  /** Null until farmers have rated the vendor; the UI then omits the rating. */
  rating: number | null;
  /** Paid placement; must always be labelled as sponsored. */
  sponsored?: boolean;
  /** Vendor's own hours text, shown when it cannot be read into openingHours. */
  openingHoursText?: string | null;
  /** Certified suppliers are named by the spec; certification source is unconfirmed. */
  certified: boolean;
  categories: string[];
};

export type VendorProduct = {
  id: string;
  vendorId: string;
  name: LocalizedText;
  category: string;
  /** Indicative demo offer only; the spec requests product price and stock. */
  priceKES: number | null;
  unit: LocalizedText;
  stockStatus: "in_stock" | "low_stock" | "out_of_stock" | "unknown";
};

export type VendorWithDistance = Vendor & { distanceKm: number | null };
export type VendorSearchFilters = {
  county?: string;
  category?: string;
  product?: string;
  text?: string;
};

export type Recommendation = {
  id: string;
  kind: "crop" | "livestock";
  /** Primary crop variety or livestock breed. */
  primary: CropVariety | LivestockBreed;
  reasons: RecommendationReason[];
  alternatives: Array<{ rank: number; item: CropVariety | LivestockBreed }>;
  tips: LocalizedText[];
  plantingWindow: LocalizedText;
  /** Crop spacing or livestock stocking density, matching `kind`. */
  spacingOrDensity: LocalizedText;
  maturity: { amount: number; unit: "days" | "months" };
  risks: LocalizedText[];
  nearbyVendors: VendorWithDistance[];
  matchedProducts: Array<{ product: VendorProduct; vendor: Vendor }>;
  confidence: "low" | "medium" | "high";
  disclaimer: LocalizedText;
};

export type AgroZone = {
  id: string;
  name: LocalizedText;
  centre: Coordinates;
  altitudeM: number;
  annualRainfallMm: number;
};

/** Vendor portal domain shapes are proposed and intentionally have no UI or adapter in this phase. */
export type VendorShopProfile = {
  vendorId: string;
  name: LocalizedText;
  location: Coordinates;
  county: string;
  phone: string;
  whatsapp: string;
  openingHours: OpeningHours;
  certified: boolean;
  categories: string[];
};
export type VendorProductUpdate = Pick<VendorProduct, "id" | "name" | "category" | "priceKES" | "unit" | "stockStatus">;
export type VendorPortalStats = { views: number; contacts: number };
