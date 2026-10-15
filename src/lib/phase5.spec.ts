import { describe, expect, it } from "vitest";
import { demoMarketCrops, demoMarketPrices, demoMarkets, sampleMarketPrice } from "@/mocks/market-prices";
import { bestMarketToSell, nearestMarkets, priceTrend, weeklySeries } from "@/lib/markets";
import type { Market, MarketPrice } from "@/types/market";

const pin = { latitude: -1.286, longitude: 36.829 };

describe("nearest market ordering", () => {
  it("orders by distance and applies the requested limit", () => {
    const nearest = nearestMarkets(pin, demoMarkets, 3);
    expect(nearest).toHaveLength(3);
    expect(nearest[0].market.id).toBe("nairobi-wakulima");
    expect(nearest[0].distanceKm).toBe(0);
    expect(nearest[0].distanceKm).toBeLessThanOrEqual(nearest[1].distanceKm);
  });

  it("rejects invalid limits", () => {
    expect(() => nearestMarkets(pin, demoMarkets, -1)).toThrow("non-negative integer");
    expect(() => nearestMarkets(pin, demoMarkets, 1.5)).toThrow("non-negative integer");
  });
});

describe("best market comparison", () => {
  const cropKey = "maize";
  const exactMarket = demoMarkets[0];
  const nearbyMarket: Market = { ...demoMarkets[1], latitude: -1.3, longitude: 36.84 };
  const farMarket: Market = { ...demoMarkets[2], latitude: 0.5, longitude: 35.2 };
  const price = (marketId: string, amount: number): MarketPrice => ({
    marketId,
    cropKey,
    pricePerUnit: amount,
    currency: "KES",
    unit: demoMarketCrops[0].unit,
    observedAt: "2026-10-14T00:00:00.000Z",
  });

  it("chooses the highest price within the radius and reports the difference to nearest", () => {
    const result = bestMarketToSell(cropKey, pin, [
      price(exactMarket.id, 100),
      price(nearbyMarket.id, 180),
      price(farMarket.id, 999),
    ], [exactMarket, nearbyMarket, farMarket], { radiusKm: 100, n: 3 });
    expect(result?.market.id).toBe(nearbyMarket.id);
    expect(result?.differenceFromNearest).toBe(80);
  });

  it("breaks equal price ties by distance and returns null when data/radius is empty", () => {
    const tie = bestMarketToSell(cropKey, pin, [
      price(exactMarket.id, 100),
      price(nearbyMarket.id, 100),
    ], [exactMarket, nearbyMarket], { radiusKm: 100, n: 2 });
    expect(tie?.market.id).toBe(exactMarket.id);
    expect(bestMarketToSell("beans", pin, [], [exactMarket])).toBeNull();
    expect(bestMarketToSell(cropKey, pin, [price(farMarket.id, 999)], [farMarket], { radiusKm: 1, n: 1 })).toBeNull();
  });
});

describe("four-week price trend", () => {
  const series = (values: number[]): MarketPrice[] => values.map((amount, index) => ({
    marketId: "m",
    cropKey: "maize",
    pricePerUnit: amount,
    currency: "KES",
    unit: demoMarketCrops[0].unit,
    observedAt: new Date(Date.UTC(2026, 0, index * 7 + 1)).toISOString(),
  }));

  it("uses the last four weekly points and applies the plus/minus three percent thresholds", () => {
    expect(priceTrend(series([100, 100, 100, 100, 100, 100, 100, 104]))).toEqual({ direction: "up", percentChange: 4 });
    expect(priceTrend(series([100, 100, 100, 100, 100, 100, 100, 96]))).toEqual({ direction: "down", percentChange: -4 });
    expect(priceTrend(series([100, 100, 100, 100, 100, 100, 100, 103]))).toEqual({ direction: "steady", percentChange: 3 });
    expect(priceTrend(series([100, 100, 100]))).toBeNull();
  });
});

describe("deterministic market history", () => {
  it("generates eight ordered weekly prices per market and crop without randomness", () => {
    const first = weeklySeries(demoMarkets[0].id, "maize", demoMarketPrices);
    expect(first).toHaveLength(8);
    expect(first.map((point) => Date.parse(point.observedAt))).toEqual(
      [...first.map((point) => Date.parse(point.observedAt))].sort((a, b) => a - b),
    );
    expect(sampleMarketPrice(0, 0, 3)).toEqual(sampleMarketPrice(0, 0, 3));
  });
});
