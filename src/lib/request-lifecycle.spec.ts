import { describe, expect, it } from "vitest";
import {
  acceptOffer, cancelRequest, completeRequest, createRequest, DEFAULT_REQUEST_SETTINGS, expireOffer,
  declineOffer, expertMaySeeFarmerPhone, farmerMaySeeExpertPhone, rankExperts,
  reassignRequest, requestSettingsSchema, saveFarmerFeedback, scoreExpert, urgencyOrder,
} from "@/lib/request-lifecycle";
import { demoExperts } from "@/mocks/fixtures";

const now = 1_800_000_000_000;
const newInput = {
  issueType: "crop" as const, symptomCodes: ["yellow-leaves"], urgency: "soon" as const,
  note: "", preferredTime: "morning", farmerId: "farmer-1", farmerName: "Sample farmer",
  farmerPhone: "0712345678", farmerCounty: "Sample County", farmerFarm: { latitude: -1.2, longitude: 36.8 },
  farmerCrops: ["maize"], farmerLivestock: [],
};
const experts = demoExperts.map((expert) => ({ ...expert }));

function offer() {
  return createRequest(newInput, experts, DEFAULT_REQUEST_SETTINGS, now, 1);
}

describe("request lifecycle", () => {
  it("starts offered and generates deterministic reference codes", () => {
    expect(offer().referenceCode).toBe("AGR-00001");
    expect(createRequest(newInput, experts, DEFAULT_REQUEST_SETTINGS, now, 1).referenceCode).toBe("AGR-00001");
  });

  it("accepts, completes, then records farmer feedback", () => {
    const initial = offer();
    const expertId = initial.assignedExpertId!;
    const accepted = acceptOffer(initial, expertId, now + 1);
    expect(accepted.ok).toBe(true);
    if (!accepted.ok) return;
    const completed = completeRequest(accepted.value, expertId, "Advice shared", now + 2);
    expect(completed.ok).toBe(true);
    if (!completed.ok) return;
    expect(saveFarmerFeedback(completed.value, "farmer-1", true, now + 3).ok).toBe(true);
  });

  it("returns typed errors for invalid transitions and unauthorized roles", () => {
    const initial = offer();
    expect(acceptOffer(initial, "someone-else", now).ok).toBe(false);
    expect(completeRequest(initial, initial.assignedExpertId!, "", now)).toEqual({ ok: false, error: "invalid_transition" });
    expect(cancelRequest(initial, "other-farmer", now).ok).toBe(false);
    expect(saveFarmerFeedback(initial, "farmer-1", true, now).ok).toBe(false);
  });

  it("re-offers an expired or declined offer and becomes unassigned when none remain", () => {
    const candidates = experts.slice(0, 2);
    const first = createRequest(newInput, candidates, DEFAULT_REQUEST_SETTINGS, now, 1);
    const second = declineOffer(first, first.assignedExpertId!, "busy", candidates, DEFAULT_REQUEST_SETTINGS, now + 1);
    expect(second.ok && second.value.status).toBe("offered");
    if (!second.ok) return;
    const lastExpertId = second.value.assignedExpertId!;
    const unassigned = declineOffer(second.value, lastExpertId, "", candidates, DEFAULT_REQUEST_SETTINGS, now + 2);
    expect(unassigned.ok && unassigned.value.status).toBe("unassigned");
    const single = createRequest(newInput, experts.slice(0, 1), DEFAULT_REQUEST_SETTINGS, now, 2);
    const expired = declineOffer(single, single.assignedExpertId!, "", experts.slice(0, 1), DEFAULT_REQUEST_SETTINGS, now + 31 * 60_000);
    expect(expired.ok && expired.value.status).toBe("unassigned");
  });

  it("uses settings weights to score and reorder experts deterministically", () => {
    const first = scoreExpert(experts[0], newInput.farmerFarm, DEFAULT_REQUEST_SETTINGS, now);
    const proximityOnly = { ...DEFAULT_REQUEST_SETTINGS, weights: { workload: 0, recency: 0, responseRate: 0, proximity: 1 } };
    expect(first.breakdown.proximity).toBeGreaterThan(0);
    expect(rankExperts(experts, newInput.farmerFarm, proximityOnly, now)[0].expert.id).toBe(experts[0].id);
    const workloadOnly = { ...proximityOnly, weights: { workload: 1, recency: 0, responseRate: 0, proximity: 0 } };
    expect(rankExperts(experts, newInput.farmerFarm, workloadOnly, now)[0].expert.id).toBe(experts[1].id);
  });

  it("expires an offer onto the next expert, then marks it unassigned after final expiry", () => {
    const twoExperts = experts.slice(0, 2);
    const first = createRequest(newInput, twoExperts, DEFAULT_REQUEST_SETTINGS, now, 1);
    const reoffered = expireOffer(first, twoExperts, DEFAULT_REQUEST_SETTINGS, (first.offerExpiresAt ?? now) + 1);
    expect(reoffered.status).toBe("offered");
    expect(reoffered.assignedExpertId).not.toBe(first.assignedExpertId);
    const unassigned = expireOffer(reoffered, twoExperts, DEFAULT_REQUEST_SETTINGS, (reoffered.offerExpiresAt ?? now) + 1);
    expect(unassigned.status).toBe("unassigned");
  });

  it("reassigns only to available experts and gates phone visibility by accepted status", () => {
    const initial = offer();
    expect(farmerMaySeeExpertPhone(initial)).toBe(false);
    expect(expertMaySeeFarmerPhone(initial, initial.assignedExpertId!)).toBe(false);
    const accepted = acceptOffer(initial, initial.assignedExpertId!, now + 1);
    expect(accepted.ok && farmerMaySeeExpertPhone(accepted.value)).toBe(true);
    expect(accepted.ok && expertMaySeeFarmerPhone(accepted.value, accepted.value.assignedExpertId!)).toBe(true);
    const unavailable = { ...experts[0], available: false };
    const unavailableResult = reassignRequest(initial, unavailable, DEFAULT_REQUEST_SETTINGS, now);
    expect(unavailableResult.ok ? null : unavailableResult.error).toBe("expert_unavailable");
  });

  it("validates non-negative settings and requires a positive score weight", () => {
    expect(requestSettingsSchema.safeParse(DEFAULT_REQUEST_SETTINGS).success).toBe(true);
    expect(requestSettingsSchema.safeParse({ ...DEFAULT_REQUEST_SETTINGS, weights: { workload: 0, recency: 0, responseRate: 0, proximity: 0 } }).success).toBe(false);
    expect(requestSettingsSchema.safeParse({ ...DEFAULT_REQUEST_SETTINGS, offerTimeoutMinutes: { emergency: -1, soon: 30, general_advice: 120 } }).success).toBe(false);
  });

  it("orders urgency from emergency to general advice", () => {
    expect([urgencyOrder("emergency"), urgencyOrder("soon"), urgencyOrder("general_advice")]).toEqual([0, 1, 2]);
  });
});
