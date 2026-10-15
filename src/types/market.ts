import type { Coordinates } from "@/lib/kenya-location";
import type { LocalizedText } from "@/types/business";

/** Market directory and coordinates are required by the specification; coordinates remain proposed sample fields. */
export type Market = {
  id: string;
  name: LocalizedText;
  county: string;
  /** Proposed approximate demo coordinate; production requires backend-managed coordinates. */
  latitude: number;
  longitude: number;
};

/** Per-market crop prices are required by the spec; exact response fields are proposed pending backend confirmation. */
export type MarketPrice = {
  marketId: string;
  cropKey: string;
  pricePerUnit: number;
  currency: "KES";
  unit: LocalizedText;
  observedAt: string;
};

export type PriceTrend = {
  direction: "up" | "down" | "steady";
  percentChange: number;
};

export type BestMarket = {
  market: Market;
  price: MarketPrice;
  differenceFromNearest: number;
  nearestMarket: Market;
  nearestPrice: MarketPrice;
};

export type MarketPin = Coordinates;
