import type { LocalizedText } from "@/types/business";
import type { Coordinates } from "@/lib/kenya-location";

/** Spec-confirmed capability; symptom enum codes and event-level schema are proposed. */
export type SignalEvent = {
  symptomCode: string;
  issueType: "crop" | "livestock";
  subjectKey?: string;
  latitude: number;
  longitude: number;
  weekStart: string;
};

/** Spec-confirmed aggregated clusters; grid dimensions and cell identifiers are proposed. */
export type SignalCell = {
  cellId: string;
  centerLat: number;
  centerLng: number;
  count: number;
  bySymptom: Record<string, number>;
  issueType: "crop" | "livestock";
  subjectKey?: string;
  weekStart: string;
  flagged: boolean;
};

/** Alert review/sending is specified; fields and recipient count representation are proposed. */
export type OutbreakAlert = {
  id: string;
  symptomCode: string;
  issueType: "crop" | "livestock";
  subjectKey?: string;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  message: LocalizedText;
  createdAt: string;
  status: "draft" | "sent";
  recipientCount: number;
  createdBy: string;
};

/** Threshold management is spec-confirmed; count policy is a proposed client model. */
export type OutbreakThresholds = {
  minimumCount: number;
  cellSizeDeg: number;
};

export type RiskAssessment = {
  subjectKey: string;
  level: "low" | "moderate" | "high";
  reasonKeys: string[];
  preventionKeys: string[];
};

export type SignalFilters = {
  symptomCode?: string;
  issueType?: "crop" | "livestock";
  subjectKey?: string;
  fromWeek?: string;
  throughWeek?: string;
};

export type AlertDraft = Omit<OutbreakAlert, "id" | "createdAt" | "status" | "recipientCount" | "createdBy">;
export type FarmerLocation = Coordinates & { farmerId: string };
