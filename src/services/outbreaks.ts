import { z } from "zod";
import { api, farmerApi } from "@/lib/api";
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

type BackendCell = {
  cell_id: string; center_lat: number; center_lng: number; count: number; by_symptom: Record<string, number>;
  issue_type: "crop" | "livestock"; week_start: string; flagged: boolean;
};
type BackendAlert = {
  id: string; symptom_code: string; issue_type: "crop" | "livestock"; subject_key: string | null;
  center_lat: number; center_lng: number; radius_km: number; message: { en: string; sw: string };
  status: "draft" | "sent"; recipient_count: number; created_by: string | null; created_at: string;
};

export function mapAlert(row: BackendAlert): OutbreakAlert {
  return {
    id: row.id, symptomCode: row.symptom_code, issueType: row.issue_type, subjectKey: row.subject_key ?? undefined,
    centerLat: row.center_lat, centerLng: row.center_lng, radiusKm: row.radius_km, message: row.message,
    createdAt: row.created_at, status: row.status, recipientCount: row.recipient_count, createdBy: row.created_by ?? "",
  };
}

function draftBody(draft: AlertDraft): string {
  return JSON.stringify({
    symptom_code: draft.symptomCode, issue_type: draft.issueType, subject_key: draft.subjectKey ?? null,
    center_lat: draft.centerLat, center_lng: draft.centerLng, radius_km: draft.radiusKm, message: draft.message,
  });
}

const apiAdapter: OutbreakService = {
  async getSignals(filters = {}) {
    const params = new URLSearchParams();
    if (filters.symptomCode) params.set("symptom_code", filters.symptomCode);
    if (filters.issueType) params.set("issue_type", filters.issueType);
    if (filters.fromWeek) params.set("from_week", filters.fromWeek);
    if (filters.throughWeek) params.set("through_week", filters.throughWeek);
    const cells = await api<BackendCell[]>(`/admin/outbreak-signals${params.size ? `?${params}` : ""}`);
    return cells.map((cell) => ({
      cellId: cell.cell_id, centerLat: cell.center_lat, centerLng: cell.center_lng, count: cell.count,
      bySymptom: cell.by_symptom, issueType: cell.issue_type, weekStart: cell.week_start, flagged: cell.flagged,
    }));
  },
  async listAlerts() { return (await api<BackendAlert[]>("/admin/outbreak-alerts")).map(mapAlert); },
  async listAlertsNear(pin) {
    const query = `latitude=${pin.latitude}&longitude=${pin.longitude}`;
    return (await farmerApi<BackendAlert[]>(`/outbreak-alerts/nearby?${query}`)).map(mapAlert);
  },
  async getThresholds() {
    const row = await api<{ minimum_count: number; cell_size_deg: number }>("/admin/outbreak-thresholds");
    return { minimumCount: row.minimum_count, cellSizeDeg: row.cell_size_deg };
  },
  async updateThresholds(value) {
    const row = await api<{ minimum_count: number; cell_size_deg: number }>("/admin/outbreak-thresholds", {
      method: "PATCH",
      body: JSON.stringify({ minimum_count: value.minimumCount, cell_size_deg: value.cellSizeDeg }),
    });
    return { minimumCount: row.minimum_count, cellSizeDeg: row.cell_size_deg };
  },
  async previewAlert(draft) {
    return (await api<{ recipient_count: number }>("/admin/outbreak-alerts/preview", { method: "POST", body: draftBody(draft) })).recipient_count;
  },
  async sendAlert(draft) {
    return mapAlert(await api<BackendAlert>("/admin/outbreak-alerts", { method: "POST", body: draftBody(draft) }));
  },
};

export const outbreakService = selectAdapter(getDataMode(), mockAdapter, apiAdapter);
export type { FarmerLocation };
