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
