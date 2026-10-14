import { haversineDistanceKm } from "@/lib/geo";
import type { FarmConditionsSnapshot } from "@/types/domain";
import type {
  AgroZone,
  CropVariety,
  LivestockBreed,
  LocalizedText,
  Recommendation,
  RecommendationReason,
  Suitability,
  VendorProduct,
  VendorWithDistance,
} from "@/types/business";
import type { Coordinates } from "@/lib/kenya-location";

type SuitableItem = CropVariety | LivestockBreed;

export function nearestAgroZone(point: Coordinates, zones: AgroZone[]): AgroZone | null {
  return zones.reduce<AgroZone | null>((nearest, zone) => {
    if (!nearest) return zone;
    return haversineDistanceKm(point, zone.centre) < haversineDistanceKm(point, nearest.centre) ? zone : nearest;
  }, null);
}

export function fitsZone(suitability: Suitability, zone: AgroZone): boolean {
  return zone.altitudeM >= suitability.altitudeM.min && zone.altitudeM <= suitability.altitudeM.max
    && zone.annualRainfallMm >= suitability.annualRainfallMm.min
    && zone.annualRainfallMm <= suitability.annualRainfallMm.max;
}

export function suitabilityFitScore(suitability: Suitability, zone: AgroZone): number {
  const altitudeMidpoint = (suitability.altitudeM.min + suitability.altitudeM.max) / 2;
  const rainfallMidpoint = (suitability.annualRainfallMm.min + suitability.annualRainfallMm.max) / 2;
  const altitudeFit = 1 - Math.abs(zone.altitudeM - altitudeMidpoint) / Math.max(1, (suitability.altitudeM.max - suitability.altitudeM.min) / 2);
  const rainfallFit = 1 - Math.abs(zone.annualRainfallMm - rainfallMidpoint) / Math.max(1, (suitability.annualRainfallMm.max - suitability.annualRainfallMm.min) / 2);
  return Math.round(Math.max(0, (altitudeFit + rainfallFit) * 50) * 100) / 100;
}

export function rankCatalogue<T extends SuitableItem>(catalogue: T[], zone: AgroZone): T[] {
  return catalogue
    .filter((item) => fitsZone(item.suitability, zone))
    .sort((left, right) => suitabilityFitScore(right.suitability, zone) - suitabilityFitScore(left.suitability, zone)
      || left.id.localeCompare(right.id));
}

export function recommendationReasons(
  zone: AgroZone,
  conditions?: Pick<FarmConditionsSnapshot, "ndviTrend" | "rainfallTrend"> | null,
): RecommendationReason[] {
  const reasons: RecommendationReason[] = [
    { key: "altitudeFit", params: { altitude: zone.altitudeM } },
    { key: "rainfallFit", params: { rainfall: zone.annualRainfallMm } },
  ];
  if (conditions?.ndviTrend) reasons.push({ key: "ndviTrend", params: { trend: conditions.ndviTrend } });
  if (conditions?.rainfallTrend) reasons.push({ key: "rainfallTrend", params: { trend: conditions.rainfallTrend } });
  return reasons;
}

export function buildRecommendations(
  kind: "crop" | "livestock",
  catalogue: SuitableItem[],
  zone: AgroZone,
  vendors: VendorWithDistance[],
  products: VendorProduct[],
  conditions?: Pick<FarmConditionsSnapshot, "ndviTrend" | "rainfallTrend"> | null,
): Recommendation[] {
  const ranked = rankCatalogue(catalogue, zone);
  const item = ranked[0];
  if (!item) return [];
  const alternatives = ranked.slice(1, 4)
    .map((alternative, index) => ({ rank: index + 2, item: alternative }));
  const productCategories = kind === "crop" ? ["seeds", "fertiliser", "tools"] : ["feed", "vaccines", "tools"];
  const matchedProducts = products
    .filter((product) => productCategories.includes(product.category) && product.stockStatus !== "out_of_stock")
    .slice(0, 4)
    .flatMap((product) => {
      const vendor = vendors.find((candidate) => candidate.id === product.vendorId);
      return vendor ? [{ product, vendor }] : [];
    });
  const tips = "intercroppingTips" in item
    ? [...item.intercroppingTips, ...item.rotationTips]
    : [...item.feedPlan];
  const maturity = "maturityDays" in item
    ? { amount: item.maturityDays, unit: "days" as const }
    : { amount: item.maturityMonths, unit: "months" as const };
  return [{
    id: `${kind}-${item.id}`,
    kind,
    primary: item,
    reasons: recommendationReasons(zone, conditions),
    alternatives,
    tips,
    plantingWindow: item.plantingWindow,
    spacingOrDensity: "spacing" in item ? item.spacing : item.stockingDensity,
    maturity,
    risks: item.risks,
    nearbyVendors: vendors.slice(0, 3),
    matchedProducts,
    confidence: conditions?.ndviTrend || conditions?.rainfallTrend ? "medium" : "low",
    disclaimer: {
      en: "Guidance, not a guarantee. These sample suggestions are not agronomic advice.",
      sw: "Ni mwongozo, si hakikisho. Mapendekezo haya ya mfano si ushauri wa kitaalamu wa kilimo.",
    } satisfies LocalizedText,
  }];
}
