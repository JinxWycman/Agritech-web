import { z } from "zod";
import { pinSchema } from "@/lib/account-validation";

const staffPasswordSchema = z.string().min(8).max(128);

/**
 * One sign-in for every role. Farmers use a numeric PIN (4–10 digits) and
 * staff a password (8+ characters), so the secret decides which login to try;
 * an 8–10 digit secret could be either and tries the farmer login first.
 */
export function loginAttempts(secret: string): ("farmer" | "staff")[] {
  const isPin = pinSchema.safeParse(secret).success;
  const isPassword = staffPasswordSchema.safeParse(secret).success;
  return [...(isPin ? ["farmer" as const] : []), ...(isPassword ? ["staff" as const] : [])];
}
