import { describe, expect, it } from "vitest";
import { demoAgroZones, demoCropVarieties, demoLivestockBreeds, demoVendorProducts, demoVendors } from "@/mocks/business-catalogue";
import { filterAndSortVendors } from "@/lib/vendor-search";
import { buildRecommendations, nearestAgroZone, rankCatalogue, recommendationReasons } from "@/lib/recommendations";
import { isOpenNow } from "@/lib/vendor-hours";
import { toWhatsAppKenya } from "@/lib/phone";

describe("sample recommendation logic", () => {
  it("provides a primary recommendation and three ranked alternatives across sample zones", () => {
    expect(demoCropVarieties).toHaveLength(6);
    expect(demoLivestockBreeds).toHaveLength(5);
    expect(demoVendors).toHaveLength(8);
    expect(new Set(demoVendors.map((vendor) => vendor.county)).size).toBeGreaterThanOrEqual(3);
    for (const zone of demoAgroZones) {
      const candidates = rankCatalogue(demoCropVarieties, zone);
      expect(candidates.length).toBeGreaterThanOrEqual(4);
      const vendors = filterAndSortVendors(demoVendors, demoVendorProducts, {}, zone.centre);
      const recommendations = buildRecommendations("crop", demoCropVarieties, zone, vendors, demoVendorProducts);
      expect(recommendations[0].alternatives).toHaveLength(3);
      const breedCandidates = rankCatalogue(demoLivestockBreeds, zone);
      expect(breedCandidates.length).toBeGreaterThanOrEqual(4);
      expect(buildRecommendations("livestock", demoLivestockBreeds, zone, vendors, demoVendorProducts)[0].alternatives).toHaveLength(3);
    }
  });

  it("selects the nearest agro-zone and ranks only varieties within both suitability ranges", () => {
    const zone = nearestAgroZone({ latitude: -0.3, longitude: 36.08 }, demoAgroZones);
    expect(zone?.id).toBe("highland");
    const ranked = rankCatalogue(demoCropVarieties, zone!);
    expect(ranked.length).toBeGreaterThan(1);
    expect(ranked[0].id).toBe("maize-highland-sample");
    expect(ranked.every((item) => item.suitability.altitudeM.min <= zone!.altitudeM
      && item.suitability.altitudeM.max >= zone!.altitudeM
      && item.suitability.annualRainfallMm.min <= zone!.annualRainfallMm
      && item.suitability.annualRainfallMm.max >= zone!.annualRainfallMm)).toBe(true);
  });

  it("builds localized reason keys with farm-condition trends and ranked alternatives", () => {
    const zone = demoAgroZones[0];
    const reasons = recommendationReasons(zone, { ndviTrend: "above", rainfallTrend: "below" });
    expect(reasons.map((reason) => reason.key)).toEqual(["altitudeFit", "rainfallFit", "ndviTrend", "rainfallTrend"]);
    expect(reasons[2].params).toEqual({ trend: "above" });
    const vendors = filterAndSortVendors(demoVendors, demoVendorProducts, {}, zone.centre);
    const cards = buildRecommendations("crop", demoCropVarieties, zone, vendors, demoVendorProducts, { ndviTrend: "above" });
    expect(cards).toHaveLength(1);
    expect(cards[0].alternatives).toHaveLength(3);
    expect(cards[0].alternatives.map(({ rank }) => rank)).toEqual([2, 3, 4]);
    expect(cards[0].matchedProducts.every(({ vendor }) => vendors.some((item) => item.id === vendor.id))).toBe(true);
  });
});

describe("vendor search and distance", () => {
  it("filters by county, category, product text, and search, then sorts by farm distance", () => {
    const nearby = filterAndSortVendors(demoVendors, demoVendorProducts, { category: "seeds" }, { latitude: -1.17, longitude: 36.83 });
    expect(nearby[0].id).toBe("kiambu-agro-sample");
    expect(nearby[0].distanceKm).toBe(0);
    const filtered = filterAndSortVendors(demoVendors, demoVendorProducts, {
      county: "Kilifi",
      category: "feed",
      product: "goat",
      text: "coast",
    });
    expect(filtered.map((vendor) => vendor.id)).toEqual(["kilifi-agro-sample"]);
  });
});

describe("vendor local opening hours", () => {
  it("uses UTC+3 and treats closing time as exclusive", () => {
    const hours = { 1: { open: "08:00", close: "17:00" } };
    expect(isOpenNow(hours, new Date("2026-10-12T06:00:00Z"))).toBe(true);
    expect(isOpenNow(hours, new Date("2026-10-12T14:00:00Z"))).toBe(false);
  });

  it("keeps overnight opening hours active after midnight", () => {
    const hours = { 1: { open: "22:00", close: "02:00" } };
    expect(isOpenNow(hours, new Date("2026-10-12T21:30:00Z"))).toBe(true);
  });
});

describe("WhatsApp phone formatting", () => {
  it("normalizes Kenyan mobile numbers for wa.me", () => {
    expect(toWhatsAppKenya("0712 345 678")).toBe("254712345678");
    expect(toWhatsAppKenya("+254712345678")).toBe("254712345678");
    expect(toWhatsAppKenya("71234")).toBeNull();
    expect(toWhatsAppKenya("071234567890")).toBeNull();
  });
});
