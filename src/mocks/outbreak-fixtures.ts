import { weekStart } from "@/lib/outbreaks";
import type { FarmerLocation, SignalEvent } from "@/types/outbreak";

const outbreakRegions = [
  { latitude: -1.28, longitude: 36.82 },
  { latitude: -0.30, longitude: 36.08 },
  { latitude: -0.10, longitude: 34.75 },
  { latitude: -3.22, longitude: 40.12 },
];
const symptomCodes = ["yellow-leaves", "spots-on-leaves", "pest-damage", "poor-growth", "not-eating", "coughing", "lameness"];
const cropKeys = ["maize", "beans", "potatoes", "vegetables"];
const animalKeys = ["cattle", "goats", "poultry"];

export const demoOutbreakSignals: SignalEvent[] = Array.from({ length: 40 }, (_, index) => {
  const weekOffset = Math.floor(index / 5);
  const day = new Date(Date.UTC(2026, 9, 12 - weekOffset * 7));
  const region = outbreakRegions[index % outbreakRegions.length];
  const issueType = index % 5 === 4 ? "livestock" : "crop";
  return {
    symptomCode: symptomCodes[(index + weekOffset) % symptomCodes.length],
    issueType,
    subjectKey: issueType === "crop" ? cropKeys[(index + weekOffset) % cropKeys.length] : animalKeys[(index + weekOffset) % animalKeys.length],
    latitude: region.latitude + ((index % 3) - 1) * 0.06,
    longitude: region.longitude + ((index % 4) - 1.5) * 0.06,
    weekStart: weekStart(day),
  };
});

export const demoFarmerLocations: FarmerLocation[] = Array.from({ length: 20 }, (_, index) => {
  const region = outbreakRegions[index % outbreakRegions.length];
  return {
    farmerId: `demo-radius-farmer-${index + 1}`,
    latitude: region.latitude + ((index % 5) - 2) * 0.025,
    longitude: region.longitude + ((index % 4) - 1.5) * 0.025,
  };
});
