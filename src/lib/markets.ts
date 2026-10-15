import { haversineDistanceKm } from "@/lib/geo";
import type { Coordinates } from "@/lib/kenya-location";
import type { BestMarket, Market, MarketPrice, PriceTrend } from "@/types/market";

export type MarketDistance = { market: Market; distanceKm: number };

export function nearestMarkets(pin: Coordinates, markets: Market[], n = 5): MarketDistance[] {
  if (!Number.isInteger(n) || n < 0) throw new Error("Market count must be a non-negative integer.");
  return markets
    .map((market) => ({
      market,
      distanceKm: haversineDistanceKm(pin, { latitude: market.latitude, longitude: market.longitude }),
    }))
    .sort((left, right) => left.distanceKm - right.distanceKm || left.market.id.localeCompare(right.market.id))
    .slice(0, n);
}

export function bestMarketToSell(
  cropKey: string,
  pin: Coordinates,
  prices: MarketPrice[],
  markets: Market[],
  options: { radiusKm?: number; n?: number } = {},
): BestMarket | null {
  const radiusKm = options.radiusKm ?? 100;
  const nearest = nearestMarkets(pin, markets, options.n ?? 5);
  const nearestWithPrice = nearest.flatMap(({ market }) => {
    const price = prices.find((item) => item.marketId === market.id && item.cropKey === cropKey);
    return price ? [{ market, price }] : [];
  });
  const baseline = nearestWithPrice[0];
  if (!baseline) return null;
  const best = nearestWithPrice
    .filter(({ market }) => haversineDistanceKm(pin, { latitude: market.latitude, longitude: market.longitude }) <= radiusKm)
    .sort((left, right) => right.price.pricePerUnit - left.price.pricePerUnit
      || haversineDistanceKm(pin, left.market) - haversineDistanceKm(pin, right.market)
      || left.market.id.localeCompare(right.market.id))[0];
  if (!best) return null;
  return {
    market: best.market,
    price: best.price,
    differenceFromNearest: best.price.pricePerUnit - baseline.price.pricePerUnit,
    nearestMarket: baseline.market,
    nearestPrice: baseline.price,
  };
}

export function priceTrend(history: MarketPrice[]): PriceTrend | null {
  if (history.length < 4) return null;
  const sorted = [...history].sort((left, right) => Date.parse(left.observedAt) - Date.parse(right.observedAt));
  const recentFour = sorted.slice(-4);
  const first = recentFour[0].pricePerUnit;
  const last = recentFour[recentFour.length - 1].pricePerUnit;
  if (!Number.isFinite(first) || !Number.isFinite(last) || first <= 0) return null;
  const percentChange = Math.round(((last - first) / first) * 10000) / 100;
  return { direction: percentChange > 3 ? "up" : percentChange < -3 ? "down" : "steady", percentChange };
}

export function weeklySeries(
  marketId: string,
  cropKey: string,
  prices: MarketPrice[],
): MarketPrice[] {
  return prices
    .filter((price) => price.marketId === marketId && price.cropKey === cropKey)
    .sort((left, right) => Date.parse(left.observedAt) - Date.parse(right.observedAt));
}
