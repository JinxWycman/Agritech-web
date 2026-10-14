import type { FarmConditionsSnapshot } from "@/types/domain";

export const KENYA_BOUNDS = {
  south: -4.7,
  north: 5.1,
  west: 33.9,
  east: 41.9,
} as const;

export type Coordinates = { latitude: number; longitude: number };

export const COUNTY_CENTRES: ReadonlyArray<{ name: string; latitude: number; longitude: number }> = [
  { name: "Baringo", latitude: 0.47, longitude: 35.97 },
  { name: "Bomet", latitude: -0.78, longitude: 35.34 },
  { name: "Bungoma", latitude: 0.57, longitude: 34.56 },
  { name: "Busia", latitude: 0.46, longitude: 34.11 },
  { name: "Elgeyo-Marakwet", latitude: 0.80, longitude: 35.50 },
  { name: "Embu", latitude: -0.53, longitude: 37.45 },
  { name: "Garissa", latitude: -0.46, longitude: 39.64 },
  { name: "Homa Bay", latitude: -0.53, longitude: 34.46 },
  { name: "Isiolo", latitude: 0.35, longitude: 37.58 },
  { name: "Kajiado", latitude: -2.10, longitude: 36.78 },
  { name: "Kakamega", latitude: 0.28, longitude: 34.75 },
  { name: "Kericho", latitude: -0.37, longitude: 35.28 },
  { name: "Kiambu", latitude: -1.17, longitude: 36.83 },
  { name: "Kilifi", latitude: -3.22, longitude: 40.12 },
  { name: "Kirinyaga", latitude: -0.50, longitude: 37.28 },
  { name: "Kisii", latitude: -0.68, longitude: 34.78 },
  { name: "Kisumu", latitude: -0.10, longitude: 34.75 },
  { name: "Kitui", latitude: -1.37, longitude: 38.01 },
  { name: "Kwale", latitude: -4.17, longitude: 39.45 },
  { name: "Laikipia", latitude: 0.02, longitude: 37.07 },
  { name: "Lamu", latitude: -2.27, longitude: 40.90 },
  { name: "Machakos", latitude: -1.52, longitude: 37.27 },
  { name: "Makueni", latitude: -2.25, longitude: 37.90 },
  { name: "Mandera", latitude: 3.94, longitude: 41.86 },
  { name: "Marsabit", latitude: 2.33, longitude: 37.99 },
  { name: "Meru", latitude: 0.05, longitude: 37.65 },
  { name: "Migori", latitude: -1.06, longitude: 34.47 },
  { name: "Mombasa", latitude: -4.05, longitude: 39.67 },
  { name: "Murang'a", latitude: -0.72, longitude: 37.15 },
  { name: "Nairobi", latitude: -1.29, longitude: 36.82 },
  { name: "Nakuru", latitude: -0.30, longitude: 36.08 },
  { name: "Nandi", latitude: 0.18, longitude: 35.13 },
  { name: "Narok", latitude: -1.08, longitude: 35.87 },
  { name: "Nyamira", latitude: -0.56, longitude: 34.93 },
  { name: "Nyandarua", latitude: -0.18, longitude: 36.52 },
  { name: "Nyeri", latitude: -0.42, longitude: 36.95 },
  { name: "Samburu", latitude: 1.10, longitude: 36.70 },
  { name: "Siaya", latitude: 0.06, longitude: 34.29 },
  { name: "Taita-Taveta", latitude: -3.40, longitude: 38.36 },
  { name: "Tana River", latitude: -1.50, longitude: 39.95 },
  { name: "Tharaka-Nithi", latitude: -0.30, longitude: 37.80 },
  { name: "Trans Nzoia", latitude: 1.02, longitude: 34.95 },
  { name: "Turkana", latitude: 3.12, longitude: 35.60 },
  { name: "Uasin Gishu", latitude: 0.52, longitude: 35.27 },
  { name: "Vihiga", latitude: 0.08, longitude: 34.72 },
  { name: "Wajir", latitude: 1.75, longitude: 40.06 },
  { name: "West Pokot", latitude: 1.62, longitude: 35.12 },
];

export function isWithinKenya({ latitude, longitude }: Coordinates): boolean {
  return latitude >= KENYA_BOUNDS.south && latitude <= KENYA_BOUNDS.north
    && longitude >= KENYA_BOUNDS.west && longitude <= KENYA_BOUNDS.east;
}

export function clampToKenya({ latitude, longitude }: Coordinates): Coordinates {
  return {
    latitude: Math.max(KENYA_BOUNDS.south, Math.min(KENYA_BOUNDS.north, latitude)),
    longitude: Math.max(KENYA_BOUNDS.west, Math.min(KENYA_BOUNDS.east, longitude)),
  };
}

export function countyFromCoordinates(point: Coordinates): string {
  const closest = COUNTY_CENTRES.reduce((best, county) => {
    const distance = (county.latitude - point.latitude) ** 2 + (county.longitude - point.longitude) ** 2;
    return distance < best.distance ? { name: county.name, distance } : best;
  }, { name: COUNTY_CENTRES[0].name, distance: Number.POSITIVE_INFINITY });
  return closest.name;
}

export function buildFarmConditionsSentence(
  snapshot: Pick<FarmConditionsSnapshot, "ndviTrend" | "rainfallTrend">,
  copy: {
    greener: string;
    lessGreen: string;
    usualGreen: string;
    rainfallAbove: string;
    rainfallBelow: string;
    rainfallUsual: string;
  },
): string {
  const vegetation = snapshot.ndviTrend === "above"
    ? copy.greener
    : snapshot.ndviTrend === "below"
      ? copy.lessGreen
      : copy.usualGreen;
  const rainfall = snapshot.rainfallTrend === "above"
    ? copy.rainfallAbove
    : snapshot.rainfallTrend === "below"
      ? copy.rainfallBelow
      : copy.rainfallUsual;
  return `${vegetation} ${rainfall}`;
}
