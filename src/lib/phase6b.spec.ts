import { describe, expect, it } from "vitest";
import { advancePayment } from "@/services/subscription";
import { computePerformance } from "@/lib/expert-performance";
import { deriveNotifications } from "@/services/notifications";
import { notificationPreferencesSchema, pinChangeSchema } from "@/lib/account-validation";
import { acceptOffer, createRequest, declineOffer, DEFAULT_REQUEST_SETTINGS, type ExpertRequestRecord } from "@/lib/request-lifecycle";
import { demoExperts } from "@/mocks/fixtures";
import type { Payment, NotificationPreferences } from "@/types/account";

const payment: Payment = { id: "p1", amountKes: 250, status: "pending", createdAt: 1000, phoneLast4: "5678" };
const request = (overrides: Partial<ExpertRequestRecord> = {}): ExpertRequestRecord => ({
  id: "r1", referenceCode: "AGR-00001", status: "completed", issueType: "crop", symptomCodes: ["yellow-leaves"], urgency: "soon", note: "", preferredTime: "anytime", channel: "web",
  farmerId: "demo-farmer-1", farmerName: "Sample farmer", farmerPhone: "+254712345678", farmerCounty: "Nairobi", farmerFarm: null, farmerCrops: ["maize"], farmerLivestock: [],
  assignedExpertId: "expert-1", offeredExpertIds: ["expert-1"], offerExpiresAt: null, createdAt: 1, updatedAt: 3000, offeredAt: 1000, respondedAt: 2000, expertNotes: [], declineReasons: [], solved: true, ...overrides,
});
const preferences: NotificationPreferences = { expertUpdates: { inApp: true, sms: false }, outbreakAlerts: { inApp: true, sms: false }, marketPrices: { inApp: false, sms: true }, };

describe("simulated payment transitions", () => {
  it("shows the prompt for five seconds, then resolves success and error scenarios", () => {
    expect(advancePayment(payment, 5999, "success").status).toBe("prompt_sent");
    expect(advancePayment(payment, 6000, "success").status).toBe("paid");
    expect(advancePayment(payment, 6000, "error").status).toBe("failed");
  });
  it("does not change terminal payment states", () => { expect(advancePayment({ ...payment, status: "cancelled" }, 9000, "success").status).toBe("cancelled"); });
});

describe("notification derivation and read state", () => {
  it("creates one request notification per request status and honours saved read ids", () => {
    const items = deriveNotifications([request({ id: "r2", status: "accepted", solved: null })], [], new Set(["request:r2:accepted"]));
    const statusItem = items.find((item) => item.id === "request:r2:accepted");
    expect(statusItem?.kind).toBe("expert_request");
    expect(statusItem?.read).toBe(true);
    expect(items.filter((item) => item.kind === "system")).toHaveLength(2);
  });
});

describe("account validation", () => {
  it("validates notification preference toggles", () => {
    expect(notificationPreferencesSchema.safeParse(preferences).success).toBe(true);
    expect(notificationPreferencesSchema.safeParse({ ...preferences, outbreakAlerts: { sms: "yes" } }).success).toBe(false);
  });
  it("enforces the assumed PIN length, matching confirmation, and changed PIN", () => {
    expect(pinChangeSchema.safeParse({ currentPin: "1234", newPin: "5678", confirmPin: "5678" }).success).toBe(true);
    expect(pinChangeSchema.safeParse({ currentPin: "1234", newPin: "5678", confirmPin: "5679" }).success).toBe(false);
    expect(pinChangeSchema.safeParse({ currentPin: "1234", newPin: "1234", confirmPin: "1234" }).success).toBe(false);
  });
});

describe("expert performance", () => {
  it("computes response median, acceptance, and feedback rates", () => {
    const records = [
      request({ id: "a", offeredAt: 0, respondedAt: 10 * 60_000, solved: true }),
      request({ id: "b", offeredAt: 0, respondedAt: 20 * 60_000, solved: false }),
      request({ id: "c", offeredAt: 0, respondedAt: 30 * 60_000, solved: null }),
      request({ id: "d", status: "cancelled", assignedExpertId: "other", offeredExpertIds: ["expert-1"], solved: null }),
    ];
    const result = computePerformance(records, "expert-1");
    expect(result).toEqual({ completedCount: 3, medianResponseMinutes: 20, acceptRate: 0.75, feedbackCount: 2, solvedRate: 0.5 });
  });
  it("excludes legacy records without timestamps and handles empty data", () => {
    expect(computePerformance([request({ offeredAt: undefined, respondedAt: undefined })], "expert-1")).toMatchObject({ completedCount: 1, medianResponseMinutes: null, feedbackCount: 1 });
    expect(computePerformance([], "expert-1")).toEqual({ completedCount: 0, medianResponseMinutes: null, acceptRate: 0, feedbackCount: 0, solvedRate: null });
  });
});

describe("lifecycle response timestamps", () => {
  const input = { issueType: "crop" as const, symptomCodes: ["yellow-leaves"], urgency: "soon" as const, note: "", preferredTime: "anytime", farmerId: "demo-farmer-1", farmerName: "Sample farmer", farmerPhone: "+254712345678", farmerCounty: "Nairobi", farmerFarm: null, farmerCrops: ["maize"], farmerLivestock: [] };
  it("stamps offer and acceptance times", () => {
    const offer = createRequest(input, demoExperts, DEFAULT_REQUEST_SETTINGS, 1000, 1);
    expect(offer.offeredAt).toBe(1000);
    if (offer.assignedExpertId) {
      const accepted = acceptOffer(offer, offer.assignedExpertId, 2000);
      expect(accepted.ok && accepted.value.respondedAt).toBe(2000);
    }
  });
  it("stamps the response when declining", () => {
    const offer = createRequest(input, demoExperts, DEFAULT_REQUEST_SETTINGS, 1000, 2);
    if (!offer.assignedExpertId) throw new Error("Expected a demo expert to receive the offer.");
    const result = declineOffer(offer, offer.assignedExpertId, "", demoExperts, DEFAULT_REQUEST_SETTINGS, 2000);
    expect(result.ok && result.value.respondedAt).toBe(2000);
  });
});
