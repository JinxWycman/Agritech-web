import { afterEach, describe, expect, it, vi } from "vitest";
import { mapFarmerRequest } from "@/services/adapters/api";
import { weatherConditionKey } from "@/services/farm-conditions";

describe("live farmer adapters", () => {
  it("maps a backend request onto the lifecycle record", () => {
    const record = mapFarmerRequest({
      id: "r1", farmer_id: "f1", expert_id: "e1", issue_type: "livestock", description: "Cow not eating",
      status: "Accepted", preferred_visit_date: null, created_at: "2026-10-18T08:00:00Z", updated_at: "2026-10-18T09:00:00Z",
      request_code: "ER-ABCD1234", farmer_resolution: null,
      expert: { id: "e1", full_name: "Vet", phone_number: "+254711000001" },
    });
    expect(record).toMatchObject({ status: "accepted", issueType: "livestock", referenceCode: "ER-ABCD1234", expertPhone: "+254711000001", solved: null });
    expect(record.createdAt).toBe(Date.parse("2026-10-18T08:00:00Z"));
  });

  it("maps feedback outcomes", () => {
    const base = { id: "r", farmer_id: "f", expert_id: null, issue_type: "crop", description: "x", status: "Completed", preferred_visit_date: null,
      created_at: "2026-10-18T08:00:00Z", updated_at: "2026-10-18T08:00:00Z", request_code: "ER-1", expert: null };
    expect(mapFarmerRequest({ ...base, farmer_resolution: "solved" }).solved).toBe(true);
    expect(mapFarmerRequest({ ...base, farmer_resolution: "unsolved" }).solved).toBe(false);
  });

  it("maps OpenWeather conditions to translated keys", () => {
    expect(weatherConditionKey("Clouds", "scattered clouds")).toBe("partlyCloudy");
    expect(weatherConditionKey("Clouds", "overcast clouds")).toBe("cloudy");
    expect(weatherConditionKey("Rain", "light rain")).toBe("lightRain");
    expect(weatherConditionKey("Rain", "heavy intensity rain")).toBe("rain");
    expect(weatherConditionKey("Thunderstorm")).toBe("thunderstorm");
    expect(weatherConditionKey(null)).toBe("partlyCloudy");
  });
});

import { loginAttempts } from "@/lib/login-attempts";
import { farmEntryErrors } from "@/lib/farmer-profile-schema";

describe("role-detecting sign-in", () => {
  it("routes the secret to the matching login", () => {
    expect(loginAttempts("1234")).toEqual(["farmer"]);
    expect(loginAttempts("Secret-pass1")).toEqual(["staff"]);
    expect(loginAttempts("12345678")).toEqual(["farmer", "staff"]);
    expect(loginAttempts("12")).toEqual([]);
  });
});

describe("farm entry validation", () => {
  it("requires backend fields for each selected crop and animal", () => {
    expect(farmEntryErrors([{ farmSizeAcres: 2, soilType: "loam", experienceLevel: "beginner" }], [{ herdSize: 3 }])).toEqual([]);
    expect(farmEntryErrors([{ farmSizeAcres: 0, soilType: "loam", experienceLevel: "beginner" }], [])).toEqual(["cropDetailsError"]);
    expect(farmEntryErrors([], [{ herdSize: 1.5 }])).toEqual(["herdSizeError"]);
  });
});

import { mapVendor, mapVendorProduct } from "@/services/adapters/api";

describe("vendor adapters", () => {
  const row = {
    id: "v1", name: "Mavuno Agrovet", county: "Meru", latitude: 0.05, longitude: 37.65, phone: "+254711000000",
    whatsapp: null, certified: true, sponsored: true, categories: ["seeds"],
    opening_hours_text: "Monday-Saturday 08:00-18:00",
    opening_hours: { "0": null, "1": { open: "08:00", close: "18:00" } }, distance_km: 2.4,
  };
  it("maps listing fields, weekday keys and missing rating", () => {
    const vendor = mapVendor(row);
    expect(vendor).toMatchObject({ sponsored: true, certified: true, rating: null, whatsapp: "", distanceKm: 2.4, county: "Meru" });
    expect(vendor.openingHours[1]).toEqual({ open: "08:00", close: "18:00" });
    expect(vendor.openingHours[0]).toBeNull();
  });
  it("keeps unknown hours empty so the UI shows the vendor's text", () => {
    expect(mapVendor({ ...row, opening_hours: null }).openingHours).toEqual({});
  });
  it("maps products including price on request", () => {
    expect(mapVendorProduct({ id: "p", vendor_id: "v1", name: "DAP", category: "fertiliser", price_kes: null, unit: "50 kg", stock_status: "unknown" }))
      .toMatchObject({ priceKES: null, stockStatus: "unknown", name: { en: "DAP", sw: "DAP" } });
  });
});

import { mapAlert } from "@/services/outbreaks";
import { generateRecommendation } from "@/lib/api";
import { SYMPTOM_CATALOGUE } from "@/lib/symptoms";

describe("outbreak and recommendation adapters", () => {
  it("maps a backend alert", () => {
    expect(mapAlert({
      id: "a1", symptom_code: "yellow-leaves", issue_type: "crop", subject_key: null, center_lat: 0.05, center_lng: 37.65,
      radius_km: 15, message: { en: "Hi", sw: "Habari" }, status: "sent", recipient_count: 12, created_by: null, created_at: "2026-10-19T08:00:00Z",
    })).toMatchObject({ symptomCode: "yellow-leaves", radiusKm: 15, recipientCount: 12, subjectKey: undefined, createdBy: "" });
  });
  it("uses only backend-valid symptom codes", () => {
    for (const { code } of SYMPTOM_CATALOGUE) expect(code).toMatch(/^[a-z0-9-]{2,40}$/);
  });
  it("polls a recommendation job until done", async () => {
    const replies = [{ job_id: "j1", status: "queued" }, { job_id: "j1", status: "running" }, { job_id: "j1", status: "done", recommendation: { id: "r1" }, sms: { status: "submitted" } }];
    const calls: string[] = [];
    vi.stubEnv("NEXT_PUBLIC_DATA_MODE", "api");
    const original = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      calls.push(String(input));
      return new Response(JSON.stringify(replies.shift()), { status: 200, headers: { "content-type": "application/json" } });
    }) as typeof fetch;
    try {
      const { setFarmerSession } = await import("@/lib/api");
      setFarmerSession("test-token");
      const result = await generateRecommendation("crop", {}, async () => undefined);
      expect(result.recommendation.id).toBe("r1");
      expect(calls.some((url) => url.includes("/recommendations/jobs/j1"))).toBe(true);
    } finally {
      globalThis.fetch = original;
    }
  });
  afterEach(() => vi.unstubAllEnvs());
});
