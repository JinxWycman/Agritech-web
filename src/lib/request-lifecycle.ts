import { z } from "zod";
import type { Expert } from "@/types/domain";

export type RequestStatus = "pending" | "offered" | "accepted" | "completed" | "unassigned" | "escalated" | "cancelled";
export type RequestUrgency = "emergency" | "soon" | "general_advice";
export type FarmPoint = { latitude: number; longitude: number };
export type ScoreWeights = { workload: number; recency: number; responseRate: number; proximity: number };
export type OfferTimeouts = { emergency: number; soon: number; general_advice: number };
export type RequestSettings = { weights: ScoreWeights; offerTimeoutMinutes: OfferTimeouts };
export type ExpertRequestRecord = {
  id: string;
  referenceCode: string;
  status: RequestStatus;
  issueType: "crop" | "livestock";
  symptomCodes: string[];
  urgency: RequestUrgency;
  note: string;
  preferredTime: string;
  channel: "web";
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  farmerCounty: string;
  farmerFarm: FarmPoint | null;
  farmerCrops: string[];
  farmerLivestock: string[];
  assignedExpertId: string | null;
  expertPhone?: string | null;
  offeredExpertIds: string[];
  offerExpiresAt: number | null;
  createdAt: number;
  updatedAt: number;
  expertNotes: string[];
  declineReasons: string[];
  solved: boolean | null;
};
export type NewRequest = Pick<ExpertRequestRecord, "issueType" | "symptomCodes" | "urgency" | "note" | "preferredTime" | "farmerId" | "farmerName" | "farmerPhone" | "farmerCounty" | "farmerFarm" | "farmerCrops" | "farmerLivestock">;
export type LifecycleError = "invalid_transition" | "expert_unavailable" | "request_not_found" | "offer_expired";
export type Result<T> = { ok: true; value: T } | { ok: false; error: LifecycleError };
export type ScoredExpert = { expert: Expert; score: number; breakdown: Record<keyof ScoreWeights, number> };

export const DEFAULT_REQUEST_SETTINGS: RequestSettings = {
  weights: { workload: 0.25, recency: 0.2, responseRate: 0.35, proximity: 0.2 },
  offerTimeoutMinutes: { emergency: 5, soon: 30, general_advice: 120 },
};

export const requestSettingsSchema = z.object({
  weights: z.object({ workload: z.number().min(0), recency: z.number().min(0), responseRate: z.number().min(0), proximity: z.number().min(0) })
    .refine((weights) => Object.values(weights).some((weight) => weight > 0), { message: "atLeastOneWeight" }),
  offerTimeoutMinutes: z.object({ emergency: z.number().int().nonnegative(), soon: z.number().int().nonnegative(), general_advice: z.number().int().nonnegative() }),
});

export function urgencyOrder(urgency: RequestUrgency): number {
  return urgency === "emergency" ? 0 : urgency === "soon" ? 1 : 2;
}

function distanceKm(a: FarmPoint | undefined, b: FarmPoint | null): number {
  if (!a || !b) return 500;
  const radians = (value: number) => value * Math.PI / 180;
  const lat1 = radians(a.latitude);
  const lat2 = radians(b.latitude);
  const dLat = lat2 - lat1;
  const dLon = radians(b.longitude - a.longitude);
  const haversine = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function scoreExpert(expert: Expert, farm: FarmPoint | null, settings: RequestSettings, now: number): ScoredExpert {
  const lastAssigned = expert.lastAssignedAt ? Math.max(0, now - expert.lastAssignedAt) / 86_400_000 : 30;
  const factors = {
    workload: 1 / (1 + Math.max(0, expert.workload ?? 0)),
    recency: Math.min(1, lastAssigned / 24),
    responseRate: Math.max(0, Math.min(1, expert.responseRate ?? 0)),
    proximity: 1 / (1 + distanceKm(expert.location, farm) / 50),
  };
  const breakdown = {
    workload: factors.workload * settings.weights.workload,
    recency: factors.recency * settings.weights.recency,
    responseRate: factors.responseRate * settings.weights.responseRate,
    proximity: factors.proximity * settings.weights.proximity,
  };
  return { expert, score: Object.values(breakdown).reduce((sum, value) => sum + value, 0), breakdown };
}

export function rankExperts(experts: Expert[], farm: FarmPoint | null, settings: RequestSettings, now: number): ScoredExpert[] {
  return experts.filter((expert) => expert.available)
    .map((expert) => scoreExpert(expert, farm, settings, now))
    .sort((a, b) => b.score - a.score || a.expert.id.localeCompare(b.expert.id));
}

function offerTo(request: ExpertRequestRecord, expert: Expert, settings: RequestSettings, now: number): ExpertRequestRecord {
  return {
    ...request,
    status: "offered",
    assignedExpertId: expert.id,
    offeredExpertIds: request.offeredExpertIds.includes(expert.id) ? request.offeredExpertIds : [...request.offeredExpertIds, expert.id],
    offerExpiresAt: now + settings.offerTimeoutMinutes[request.urgency] * 60_000,
    updatedAt: now,
  };
}

function offerNext(request: ExpertRequestRecord, experts: Expert[], settings: RequestSettings, now: number): ExpertRequestRecord {
  const next = rankExperts(experts.filter((expert) => !request.offeredExpertIds.includes(expert.id)), request.farmerFarm, settings, now)[0];
  return next ? offerTo(request, next.expert, settings, now) : {
    ...request,
    status: "unassigned",
    assignedExpertId: null,
    offerExpiresAt: null,
    updatedAt: now,
  };
}

export function createRequest(input: NewRequest, experts: Expert[], settings: RequestSettings, now: number, sequence: number): ExpertRequestRecord {
  const referenceCode = `AGR-${String(sequence).padStart(5, "0")}`;
  const request: ExpertRequestRecord = {
    ...input,
    id: `demo-request-${String(sequence).padStart(5, "0")}`,
    referenceCode,
    status: "pending",
    channel: "web",
    assignedExpertId: null,
    offeredExpertIds: [],
    offerExpiresAt: null,
    createdAt: now,
    updatedAt: now,
    expertNotes: [],
    declineReasons: [],
    solved: null,
  };
  const selected = rankExperts(experts, input.farmerFarm, settings, now)[0];
  return selected ? offerTo(request, selected.expert, settings, now) : { ...request, status: "unassigned" };
}

export function expireOffer(request: ExpertRequestRecord, experts: Expert[], settings: RequestSettings, now: number): ExpertRequestRecord {
  if (request.status !== "offered" || request.offerExpiresAt === null || request.offerExpiresAt > now) return request;
  return offerNext(request, experts, settings, now);
}

export function declineOffer(request: ExpertRequestRecord, expertId: string, reason: string, experts: Expert[], settings: RequestSettings, now: number): Result<ExpertRequestRecord> {
  if (request.status !== "offered" || request.assignedExpertId !== expertId) return { ok: false, error: "invalid_transition" };
  if (request.offerExpiresAt !== null && request.offerExpiresAt <= now) return { ok: true, value: offerNext(request, experts, settings, now) };
  const declined = { ...request, declineReasons: reason.trim() ? [...request.declineReasons, reason.trim()] : request.declineReasons };
  return { ok: true, value: offerNext(declined, experts, settings, now) };
}

export function acceptOffer(request: ExpertRequestRecord, expertId: string, now: number): Result<ExpertRequestRecord> {
  if (request.status !== "offered" || request.assignedExpertId !== expertId) return { ok: false, error: "invalid_transition" };
  if (request.offerExpiresAt !== null && request.offerExpiresAt <= now) return { ok: false, error: "offer_expired" };
  return { ok: true, value: { ...request, status: "accepted", offerExpiresAt: null, updatedAt: now } };
}

export function completeRequest(request: ExpertRequestRecord, expertId: string, note: string, now: number): Result<ExpertRequestRecord> {
  if (request.status !== "accepted" || request.assignedExpertId !== expertId) return { ok: false, error: "invalid_transition" };
  return { ok: true, value: { ...request, status: "completed", expertNotes: note.trim() ? [...request.expertNotes, note.trim()] : request.expertNotes, offerExpiresAt: null, updatedAt: now } };
}

export function escalateRequest(request: ExpertRequestRecord, expertId: string, note: string, now: number): Result<ExpertRequestRecord> {
  if (request.status !== "accepted" || request.assignedExpertId !== expertId) return { ok: false, error: "invalid_transition" };
  return { ok: true, value: { ...request, status: "escalated", expertNotes: note.trim() ? [...request.expertNotes, note.trim()] : request.expertNotes, offerExpiresAt: null, updatedAt: now } };
}

export function cancelRequest(request: ExpertRequestRecord, farmerId: string, now: number): Result<ExpertRequestRecord> {
  if (request.farmerId !== farmerId || !["pending", "offered", "accepted", "unassigned", "escalated"].includes(request.status)) return { ok: false, error: "invalid_transition" };
  return { ok: true, value: { ...request, status: "cancelled", assignedExpertId: null, offerExpiresAt: null, updatedAt: now } };
}

export function reassignRequest(request: ExpertRequestRecord, expert: Expert, settings: RequestSettings, now: number): Result<ExpertRequestRecord> {
  if (!["pending", "offered", "unassigned", "escalated"].includes(request.status)) return { ok: false, error: "invalid_transition" };
  if (!expert.available) return { ok: false, error: "expert_unavailable" };
  return { ok: true, value: offerTo(request, expert, settings, now) };
}

export function saveFarmerFeedback(request: ExpertRequestRecord, farmerId: string, solved: boolean, now: number): Result<ExpertRequestRecord> {
  if (request.status !== "completed" || request.farmerId !== farmerId || request.solved !== null) return { ok: false, error: "invalid_transition" };
  return { ok: true, value: { ...request, solved, updatedAt: now } };
}

export function farmerMaySeeExpertPhone(request: ExpertRequestRecord): boolean {
  return request.status === "accepted" || request.status === "completed";
}

export function expertMaySeeFarmerPhone(request: ExpertRequestRecord, expertId: string): boolean {
  return (request.status === "accepted" || request.status === "completed") && request.assignedExpertId === expertId;
}
