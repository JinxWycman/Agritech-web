import { demoExperts } from "@/mocks/fixtures";
import {
  DEFAULT_REQUEST_SETTINGS,
  expireOffer,
  type ExpertRequestRecord,
  type RequestSettings,
} from "@/lib/request-lifecycle";
import type { Expert } from "@/types/domain";

export const DEMO_REQUEST_STORE_KEY = "agritech_demo_expert_requests_v1";
export const DEMO_EXPERT_ID_KEY = "agritech_demo_expert_id_v1";
type Store = { sequence: number; requests: ExpertRequestRecord[]; experts: Expert[]; settings: RequestSettings; clockOffsetMs: number };

function emptyStore(): Store {
  return { sequence: 0, requests: [], experts: demoExperts.map((expert) => ({ ...expert })), settings: DEFAULT_REQUEST_SETTINGS, clockOffsetMs: 0 };
}

function storage(): Storage | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

export function readRequestStore(): Store {
  const target = storage();
  if (!target) return emptyStore();
  const raw = target.getItem(DEMO_REQUEST_STORE_KEY);
  if (!raw) return emptyStore();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !Array.isArray((parsed as Store).requests) || !Array.isArray((parsed as Store).experts)) throw new Error("invalid stored request data");
    return parsed as Store;
  } catch (error) {
    throw new Error("Demo request data could not be read. Use Demo controls to clear browser storage.", { cause: error });
  }
}

export function writeRequestStore(value: Store): void {
  storage()?.setItem(DEMO_REQUEST_STORE_KEY, JSON.stringify(value));
}

export function demoNow(): number {
  return Date.now() + readRequestStore().clockOffsetMs;
}

export function readLifecycleRequests(now: () => number = demoNow): ExpertRequestRecord[] {
  const store = readRequestStore();
  const current = now();
  let changed = false;
  const requests = store.requests.map((request) => {
    const updated = expireOffer(request, store.experts, store.settings, current);
    if (updated !== request) changed = true;
    return updated;
  });
  if (changed) writeRequestStore({ ...store, requests });
  return requests;
}

export function currentDemoExpertId(): string {
  const target = storage();
  const selected = target?.getItem(DEMO_EXPERT_ID_KEY);
  const experts = readRequestStore().experts;
  return experts.some((expert) => expert.id === selected) ? selected! : experts[0]?.id ?? "";
}

export function setCurrentDemoExpertId(id: string): void {
  storage()?.setItem(DEMO_EXPERT_ID_KEY, id);
}

export function fastForwardDemoClock(minutes: number): void {
  const store = readRequestStore();
  writeRequestStore({ ...store, clockOffsetMs: store.clockOffsetMs + minutes * 60_000 });
}
