import { z } from "zod";

export const notificationPreferencesSchema = z.object({
  expertUpdates: z.object({ inApp: z.boolean(), sms: z.boolean() }),
  outbreakAlerts: z.object({ inApp: z.boolean(), sms: z.boolean() }),
  marketPrices: z.object({ inApp: z.boolean(), sms: z.boolean() }),
});

export const pinSchema = z.string().regex(/^\d{4,10}$/);

export const pinChangeSchema = z.object({
  currentPin: pinSchema,
  newPin: pinSchema,
  confirmPin: pinSchema,
}).refine((value) => value.newPin === value.confirmPin, { path: ["confirmPin"], message: "pinMismatch" })
  .refine((value) => value.currentPin !== value.newPin, { path: ["newPin"], message: "pinMustChange" });

export const serviceAreasSchema = z.object({
  counties: z.array(z.string().min(1)).min(1),
  subCounties: z.array(z.string().trim().min(1).max(80)).max(10),
}).refine((value) => new Set(value.counties).size === value.counties.length, { path: ["counties"], message: "duplicateCounty" });
