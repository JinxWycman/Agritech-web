import { haversineDistanceKm } from "@/lib/geo";
import type { Coordinates } from "@/lib/kenya-location";
import type {
  AlertDraft,
  FarmerLocation,
  OutbreakAlert,
  OutbreakThresholds,
  RiskAssessment,
  SignalCell,
  SignalEvent,
  SignalFilters,
} from "@/types/outbreak";
import type { FarmConditionsSnapshot } from "@/types/domain";

export function weekStart(date: Date): string {
  const day = date.getUTCDay();
  const mondayDelta = (day + 6) % 7;
  const monday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - mondayDelta));
  return monday.toISOString().slice(0, 10);
}

export function aggregateCells(
  events: SignalEvent[],
  options: { cellSizeDeg?: number; filters?: SignalFilters } = {},
): SignalCell[] {
  const cellSizeDeg = options.cellSizeDeg ?? 0.5;
  if (!Number.isFinite(cellSizeDeg) || cellSizeDeg <= 0) throw new Error("Cell size must be a positive number.");
  const filters = options.filters ?? {};
  const grouped = new Map<string, SignalCell>();
  for (const event of events) {
    if (filters.symptomCode && event.symptomCode !== filters.symptomCode) continue;
    if (filters.issueType && event.issueType !== filters.issueType) continue;
    if (filters.subjectKey && event.subjectKey !== filters.subjectKey) continue;
    if (filters.fromWeek && event.weekStart < filters.fromWeek) continue;
    if (filters.throughWeek && event.weekStart > filters.throughWeek) continue;
    const latIndex = Math.floor(event.latitude / cellSizeDeg);
    const lngIndex = Math.floor(event.longitude / cellSizeDeg);
    const centerLat = (latIndex + 0.5) * cellSizeDeg;
    const centerLng = (lngIndex + 0.5) * cellSizeDeg;
    const cellId = `${latIndex}:${lngIndex}:${event.issueType}:${event.subjectKey ?? "all"}:${event.weekStart}`;
    const existing = grouped.get(cellId);
    if (existing) {
      existing.count += 1;
      existing.bySymptom[event.symptomCode] = (existing.bySymptom[event.symptomCode] ?? 0) + 1;
    } else {
      grouped.set(cellId, {
        cellId, centerLat, centerLng, count: 1, bySymptom: { [event.symptomCode]: 1 },
        issueType: event.issueType, subjectKey: event.subjectKey, weekStart: event.weekStart, flagged: false,
      });
    }
  }
  return [...grouped.values()].sort((left, right) =>
    left.weekStart.localeCompare(right.weekStart) || left.cellId.localeCompare(right.cellId));
}

export function flagCells(cells: SignalCell[], threshold: number | OutbreakThresholds): SignalCell[] {
  const minimum = typeof threshold === "number" ? threshold : threshold.minimumCount;
  return cells.map((cell) => ({ ...cell, flagged: cell.count >= minimum }));
}

export function alertsNearPoint(alerts: OutbreakAlert[], pin: Coordinates): OutbreakAlert[] {
  return alerts.filter((alert) => alert.status === "sent"
    && haversineDistanceKm(pin, { latitude: alert.centerLat, longitude: alert.centerLng }) <= alert.radiusKm);
}

export function farmersInRadius(points: FarmerLocation[], center: Coordinates, radiusKm: number): number {
  if (!Number.isFinite(radiusKm) || radiusKm < 0) throw new Error("Alert radius must be non-negative.");
  return new Set(points
    .filter((point) => haversineDistanceKm(center, point) <= radiusKm)
    .map((point) => point.farmerId)).size;
}

export type RiskSubjectRules = {
  subjectKey: string;
  rainfallBelow?: "moderate" | "high";
  rainfallAbove?: "moderate" | "high";
  ndviBelow?: "moderate" | "high";
  ndviAbove?: "moderate" | "high";
};

/** SAMPLE rules only; agronomist validation is required before real farm use. */
export const SAMPLE_RISK_RULES: RiskSubjectRules[] = [
  { subjectKey: "maize", rainfallBelow: "moderate", ndviBelow: "high", rainfallAbove: "moderate" },
  { subjectKey: "beans", rainfallBelow: "moderate", ndviBelow: "moderate", rainfallAbove: "high" },
  { subjectKey: "potatoes", rainfallAbove: "high", ndviBelow: "moderate" },
  { subjectKey: "vegetables", rainfallBelow: "moderate", rainfallAbove: "moderate", ndviBelow: "moderate" },
  { subjectKey: "cattle", rainfallBelow: "moderate", ndviBelow: "moderate" },
  { subjectKey: "goats", rainfallBelow: "moderate", rainfallAbove: "moderate" },
  { subjectKey: "poultry", rainfallAbove: "moderate", ndviBelow: "moderate", ndviAbove: "moderate" },
];

export function assessRisk(
  conditions: Pick<FarmConditionsSnapshot, "rainfallTrend" | "ndviTrend"> | null | undefined,
  subject: string,
  rules: RiskSubjectRules[] = SAMPLE_RISK_RULES,
): RiskAssessment {
  const rule = rules.find((candidate) => candidate.subjectKey.toLocaleLowerCase() === subject.toLocaleLowerCase());
  const active: Array<{ type: "rainfall" | "ndvi"; trend: "below" | "above"; level: "moderate" | "high" }> = [];
  if (rule && conditions?.rainfallTrend === "below" && rule.rainfallBelow) active.push({ type: "rainfall", trend: "below", level: rule.rainfallBelow });
  if (rule && conditions?.rainfallTrend === "above" && rule.rainfallAbove) active.push({ type: "rainfall", trend: "above", level: rule.rainfallAbove });
  if (rule && conditions?.ndviTrend === "below" && rule.ndviBelow) active.push({ type: "ndvi", trend: "below", level: rule.ndviBelow });
  if (rule && conditions?.ndviTrend === "above" && rule.ndviAbove) active.push({ type: "ndvi", trend: "above", level: rule.ndviAbove });
  const level = active.some((candidate) => candidate.level === "high")
    ? "high"
    : active.length ? "moderate" : "low";
  const reasonKeys: string[] = active.map((candidate) => `risk.reason.${candidate.type}.${candidate.trend}`);
  const preventionKeys: string[] = active.map((candidate) => `risk.prevention.${candidate.type}.${candidate.trend}`);
  if (!conditions || !rule) reasonKeys.push(!conditions ? "risk.reason.conditionsUnavailable" : "risk.reason.sampleRuleUnavailable");
  if (!conditions || !rule) preventionKeys.push("risk.prevention.askExpert");
  return { subjectKey: subject, level, reasonKeys, preventionKeys };
}

export function alertDraftFromCell(cell: SignalCell, radiusKm: number, message: AlertDraft["message"]): AlertDraft {
  return {
    symptomCode: Object.entries(cell.bySymptom).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))[0]?.[0] ?? "unknown",
    issueType: cell.issueType,
    subjectKey: cell.subjectKey,
    centerLat: cell.centerLat,
    centerLng: cell.centerLng,
    radiusKm,
    message,
  };
}
