import type { LocalizedText } from "@/types/business";
import type { Market, MarketPrice } from "@/types/market";

const text = (en: string, sw: string): LocalizedText => ({ en, sw });

/** Sample market points are approximate display coordinates and must be replaced with authoritative locations. */
export const demoMarkets: Market[] = [
  { id: "nairobi-wakulima", name: text("Wakulima Market (sample)", "Soko la Wakulima (mfano)"), county: "Nairobi", latitude: -1.286, longitude: 36.829 },
  { id: "nakuru-town", name: text("Nakuru Town Market (sample)", "Soko la Mji wa Nakuru (mfano)"), county: "Nakuru", latitude: -0.303, longitude: 36.080 },
  { id: "eldoret-town", name: text("Eldoret Town Market (sample)", "Soko la Mji wa Eldoret (mfano)"), county: "Uasin Gishu", latitude: 0.514, longitude: 35.269 },
  { id: "kisumu-kibuye", name: text("Kibuye Market (sample)", "Soko la Kibuye (mfano)"), county: "Kisumu", latitude: -0.102, longitude: 34.758 },
  { id: "mombasa-marikiti", name: text("Marikiti Market (sample)", "Soko la Marikiti (mfano)"), county: "Mombasa", latitude: -4.061, longitude: 39.668 },
  { id: "meru-town", name: text("Meru Town Market (sample)", "Soko la Mji wa Meru (mfano)"), county: "Meru", latitude: 0.047, longitude: 37.649 },
  { id: "machakos-town", name: text("Machakos Town Market (sample)", "Soko la Mji wa Machakos (mfano)"), county: "Machakos", latitude: -1.516, longitude: 37.263 },
  { id: "kitui-town", name: text("Kitui Town Market (sample)", "Soko la Mji wa Kitui (mfano)"), county: "Kitui", latitude: -1.367, longitude: 38.010 },
];

export const demoMarketCrops: Array<{ key: string; name: LocalizedText; unit: LocalizedText; basePriceKES: number }> = [
  { key: "maize", name: text("Maize", "Mahindi"), unit: text("90 kg bag", "Gunia la kilo 90"), basePriceKES: 3400 },
  { key: "beans", name: text("Beans", "Maharagwe"), unit: text("90 kg bag", "Gunia la kilo 90"), basePriceKES: 9200 },
  { key: "potatoes", name: text("Potatoes", "Viazi"), unit: text("90 kg bag", "Gunia la kilo 90"), basePriceKES: 4800 },
  { key: "vegetables", name: text("Vegetables", "Mboga"), unit: text("crate", "kreti"), basePriceKES: 1800 },
  { key: "sorghum", name: text("Sorghum", "Mtama"), unit: text("90 kg bag", "Gunia la kilo 90"), basePriceKES: 5200 },
];

const baseMarketOffset = [0, -180, 260, -90, 340, -45, 110, 200];

export function sampleMarketPrice(marketIndex: number, cropIndex: number, week: number): MarketPrice {
  const crop = demoMarketCrops[cropIndex];
  const seasonalWave = Math.round(Math.sin((week + cropIndex) * Math.PI / 4) * crop.basePriceKES * 0.035);
  const weeklyDrift = (week - 7) * (cropIndex % 2 === 0 ? 22 : -16);
  const marketOffset = baseMarketOffset[marketIndex] + (marketIndex % 2 === 0 ? cropIndex * 17 : -cropIndex * 13);
  const date = new Date(Date.UTC(2026, 9, 7 - (7 - week) * 7));
  return {
    marketId: demoMarkets[marketIndex].id,
    cropKey: crop.key,
    pricePerUnit: Math.max(0, crop.basePriceKES + seasonalWave + weeklyDrift + marketOffset),
    currency: "KES",
    unit: crop.unit,
    observedAt: date.toISOString(),
  };
}

export const demoMarketPrices: MarketPrice[] = demoMarkets.flatMap((_, marketIndex) =>
  demoMarketCrops.flatMap((_, cropIndex) =>
    Array.from({ length: 8 }, (_, week) => sampleMarketPrice(marketIndex, cropIndex, week)),
  ),
);
