import { z } from "zod";
import { getDataMode, getDemoScenario, getMockDelayMs } from "@/lib/data-mode";
import { alertsNearPoint, farmersInRadius, weekStart } from "@/lib/outbreaks";
import { readLifecycleRequests } from "@/lib/request-store";
import { demoFarmerLocations, demoOutbreakSignals } from "@/mocks/outbreak-fixtures";
import { selectAdapter } from "@/services/selection";
import type { Coordinates } from "@/lib/kenya-location";
import type {
  AlertDraft,
  FarmerLocation,
  OutbreakAlert,
  OutbreakThresholds,
  SignalCell,
  SignalEvent,
  SignalFilters,
} from "@/types/outbreak";
import { aggregateCells, flagCells } from "@/lib/outbreaks";

export const DEMO_OUTBREAK_STORE_KEY = "agritech_demo_outbreak_alerts_v1";
export const outbreakThresholdSchema = z.object({
  minimumCount: z.number().int().min(1).max(1000),
  cellSizeDeg: z.number().min(0.1).max(2),
});
export const outbreakAlertDraftSchema = z.object({
  symptomCode: z.string().min(1),
  issueType: z.enum(["crop", "livestock"]),
  subjectKey: z.string().optional(),
  centerLat: z.number().min(-4.7).max(5.1),
  centerLng: z.number().min(33.9).max(41.9),
  radiusKm: z.number().min(1).max(300),
  message: z.object({ en: z.string().min(1).max(160), sw: z.string().min(1).max(160) }),
});

export type OutbreakService = {
  getSignals(filters?: SignalFilters): Promise<SignalCell[]>;
  listAlerts(): Promise<OutbreakAlert[]>;
  listAlertsNear(pin: Coordinates): Promise<OutbreakAlert[]>;
  getThresholds(): Promise<OutbreakThresholds>;
  updateThresholds(value: OutbreakThresholds): Promise<OutbreakThresholds>;
  previewAlert(draft: AlertDraft): Promise<number>;
  sendAlert(draft: AlertDraft): Promise<OutbreakAlert>;
};

type PersistedOutbreakData = {
  alerts: OutbreakAlert[];
  thresholds: OutbreakThresholds;
  sequence: number;
};

const defaults: PersistedOutbreakData = {
  alerts: [],
  thresholds: { minimumCount: 3, cellSizeDeg: 0.5 },
  sequence: 0,
};

function readStore(): PersistedOutbreakData {
  if (typeof window === "undefined") return defaults;
  const raw = window.localStorage.getItem(DEMO_OUTBREAK_STORE_KEY);
  if (!raw) return defaults;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") throw new Error("invalid data");
    const value = parsed as Partial<PersistedOutbreakData>;
    const thresholds = outbreakThresholdSchema.parse(value.thresholds);
    if (!Array.isArray(value.alerts) || typeof value.sequence !== "number") throw new Error("invalid data");
    return { alerts: value.alerts as OutbreakAlert[], thresholds, sequence: value.sequence };
  } catch (error) {
    throw new Error("Demo outbreak data could not be read. Clear this browser's demo storage to continue.", { cause: error });
  }
}

function writeStore(value: PersistedOutbreakData): void {
  if (typeof window !== "undefined") window.localStorage.setItem(DEMO_OUTBREAK_STORE_KEY, JSON.stringify(value));
}

function assertScenario(): void {
  if (getDemoScenario() === "error") throw new Error("Demo outbreak service error scenario.");
}

function lifecycleSignals(): SignalEvent[] {
  return readLifecycleRequests().flatMap((request) => {
    if (!request.farmerFarm || !request.symptomCodes.length) return [];
    return request.symptomCodes.map((symptomCode) => ({
      symptomCode,
      issueType: request.issueType,
      subjectKey: (request.issueType === "crop" ? request.farmerCrops : request.farmerLivestock)
        .map((item) => item.toLowerCase()).find((item) => item.length > 0),
      latitude: request.farmerFarm!.latitude,
      longitude: request.farmerFarm!.longitude,
      weekStart: weekStart(new Date(request.createdAt)),
    }));
  });
}

function allEvents(): SignalEvent[] {
  return [...demoOutbreakSignals, ...lifecycleSignals()];
}

function demoList(filters: SignalFilters): SignalCell[] {
  const store = readStore();
  return flagCells(aggregateCells(allEvents(), {
    cellSizeDeg: store.thresholds.cellSizeDeg,
    filters,
  }), store.thresholds);
}

const mockAdapter: OutbreakService = {
  async getSignals(filters = {}) {
    await new Promise((resolve) => setTimeout(resolve, getMockDelayMs()));
    assertScenario();
    return getDemoScenario() === "empty" ? [] : demoList(filters);
  },
  async listAlerts() {
    await new Promise((resolve) => setTimeout(resolve, getMockDelayMs()));
    assertScenario();
    return getDemoScenario() === "empty" ? [] : readStore().alerts;
  },
  async listAlertsNear(pin) {
    await new Promise((resolve) => setTimeout(resolve, getMockDelayMs()));
    assertScenario();
    return getDemoScenario() === "empty" ? [] : alertsNearPoint(readStore().alerts, pin);
  },
  async getThresholds() {
    await new Promise((resolve) => setTimeout(resolve, getMockDelayMs()));
    assertScenario();
    return readStore().thresholds;
  },
  async updateThresholds(value) {
    assertScenario();
    const thresholds = outbreakThresholdSchema.parse(value);
    const store = readStore();
    writeStore({ ...store, thresholds });
    return thresholds;
  },
  async previewAlert(draft) {
    await new Promise((resolve) => setTimeout(resolve, getMockDelayMs()));
    assertScenario();
    const valid = outbreakAlertDraftSchema.parse(draft);
    if (getDemoScenario() === "empty") return 0;
    return farmersInRadius(demoFarmerLocations, { latitude: valid.centerLat, longitude: valid.centerLng }, valid.radiusKm);
  },
  async sendAlert(draft) {
    assertScenario();
    const valid = outbreakAlertDraftSchema.parse(draft);
    const store = readStore();
    const recipientCount = farmersInRadius(
      demoFarmerLocations,
      { latitude: valid.centerLat, longitude: valid.centerLng },
      valid.radiusKm,
    );
    const alert: OutbreakAlert = {
      ...valid,
      id: `DEMO-ALERT-${String(store.sequence + 1).padStart(4, "0")}`,
      createdAt: new Date().toISOString(),
      status: "sent",
      recipientCount,
      createdBy: "demo-admin",
    };
    writeStore({ ...store, sequence: store.sequence + 1, alerts: [alert, ...store.alerts] });
    return alert;
  },
};

const apiAdapter: OutbreakService = {
  async getSignals() { throw new Error("Outbreak signal API adapter is not implemented until its backend contract is confirmed."); },
  async listAlerts() { throw new Error("Outbreak alert API adapter is not implemented until its backend contract is confirmed."); },
  async listAlertsNear() { throw new Error("Farmer alert feed API adapter is not implemented until its backend contract is confirmed."); },
  async getThresholds() { throw new Error("Outbreak threshold API adapter is not implemented until its backend contract is confirmed."); },
  async updateThresholds() { throw new Error("Outbreak threshold API adapter is not implemented until its backend contract is confirmed."); },
  async previewAlert() { throw new Error("Alert recipient preview API adapter is not implemented until its backend contract is confirmed."); },
  async sendAlert() { throw new Error("Alert sending API adapter is not implemented until its backend contract is confirmed."); },
};

export const outbreakService = selectAdapter(getDataMode(), mockAdapter, apiAdapter);
export type { FarmerLocation };
