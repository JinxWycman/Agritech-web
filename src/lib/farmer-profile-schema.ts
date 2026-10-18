import { z } from "zod";
import { isWithinKenya } from "@/lib/kenya-location";

export const farmerProfileSchema = z.object({
  farmSizeAcres: z.string().trim().min(1).transform(Number).pipe(z.number().positive()),
  crops: z.array(z.string()),
  livestock: z.array(z.string()),
  subCounty: z.string().trim().min(1),
  ward: z.string().trim().min(1),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
}).superRefine((profile, context) => {
  if (profile.latitude === null || profile.longitude === null) {
    context.addIssue({ code: "custom", path: ["latitude"], message: "locationRequired" });
    return;
  }
  if (!isWithinKenya({ latitude: profile.latitude, longitude: profile.longitude })) {
    context.addIssue({ code: "custom", path: ["latitude"], message: "locationOutsideKenya" });
  }
});

export type FarmerProfileFormValues = z.infer<typeof farmerProfileSchema>;

export const SOIL_TYPES = ["clay", "loam", "sandy", "silt", "volcanic"] as const;
export const EXPERIENCE_LEVELS = ["beginner", "intermediate", "experienced"] as const;

/** Details the backend requires for each selected crop and animal; returns error message keys. */
export function farmEntryErrors(
  crops: { farmSizeAcres: number; soilType: string; experienceLevel: string }[],
  livestock: { herdSize: number }[],
): ("cropDetailsError" | "herdSizeError")[] {
  const errors: ("cropDetailsError" | "herdSizeError")[] = [];
  const cropOk = (entry: (typeof crops)[number]) => Number.isFinite(entry.farmSizeAcres) && entry.farmSizeAcres > 0
    && (SOIL_TYPES as readonly string[]).includes(entry.soilType)
    && (EXPERIENCE_LEVELS as readonly string[]).includes(entry.experienceLevel);
  if (!crops.every(cropOk)) errors.push("cropDetailsError");
  if (!livestock.every((entry) => Number.isInteger(entry.herdSize) && entry.herdSize > 0)) errors.push("herdSizeError");
  return errors;
}
