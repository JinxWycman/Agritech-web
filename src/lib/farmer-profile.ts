import type { FarmerProfile } from "@/types/domain";

export const DEMO_PROFILE_KEY = "agritech_demo_farmer_profile_v1";

export function readDemoProfile(storage: Pick<Storage, "getItem"> = localStorage): FarmerProfile | null {
  const raw = storage.getItem(DEMO_PROFILE_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as FarmerProfile;
  } catch {
    return null;
  }
}

export function persistDemoProfile(
  profile: Omit<FarmerProfile, "county" | "profile_complete">,
  county: string,
  storage: Pick<Storage, "setItem"> = localStorage,
): FarmerProfile {
  const saved: FarmerProfile = { ...profile, county, profile_complete: true };
  storage.setItem(DEMO_PROFILE_KEY, JSON.stringify(saved));
  return saved;
}

export function resetDemoProfile(storage: Pick<Storage, "removeItem"> = localStorage): void {
  storage.removeItem(DEMO_PROFILE_KEY);
}
