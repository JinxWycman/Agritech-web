import { getDataMode, getDemoScenario, getMockDelayMs } from "@/lib/data-mode";
import { farmerApi, getFarmerProfile, listCounties } from "@/lib/api";
import { countyFromCoordinates } from "@/lib/kenya-location";
import { persistDemoProfile, readDemoProfile, resetDemoProfile } from "@/lib/farmer-profile";
import { demoFarmerProfile } from "@/mocks/fixtures";
import { selectAdapter } from "@/services/selection";
import type { FarmerProfileService } from "@/services/contracts";

const mockAdapter: FarmerProfileService = {
  async getProfile() {
    if (typeof window === "undefined") return null;
    await new Promise((resolve) => setTimeout(resolve, getMockDelayMs()));
    const scenario = getDemoScenario();
    if (scenario === "error") throw new Error("Demo service error scenario.");
    if (scenario === "empty") return null;
    return readDemoProfile() ?? { ...demoFarmerProfile, profile_complete: false };
  },
  async saveProfile(profile) {
    if (getDemoScenario() === "error") throw new Error("Demo service error scenario.");
    const county = profile.latitude !== null && profile.longitude !== null
      ? countyFromCoordinates({ latitude: profile.latitude, longitude: profile.longitude })
      : "";
    return persistDemoProfile(profile, county);
  },
  resetDemoProfile,
};

const apiAdapter: FarmerProfileService = {
  async getProfile() {
    const [profile, counties] = await Promise.all([getFarmerProfile(), listCounties()]);
    const countyName = counties.find((county) => county.id === profile.county_id)?.name ?? profile.county_id;
    return {
      farmSizeAcres: null,
      crops: [],
      livestock: [],
      subCounty: profile.sub_county ?? "",
      ward: profile.ward ?? "",
      latitude: profile.latitude,
      longitude: profile.longitude,
      county: countyName,
      profile_complete: Boolean(profile.latitude !== null && profile.longitude !== null),
    };
  },
  async saveProfile(profile) {
    const saved = await farmerApi<Awaited<ReturnType<typeof getFarmerProfile>>>("/farmers/me", {
      method: "PUT",
      body: JSON.stringify({
        latitude: profile.latitude,
        longitude: profile.longitude,
        sub_county: profile.subCounty || null,
        ward: profile.ward || null,
      }),
    });
    return {
      farmSizeAcres: null,
      crops: profile.crops,
      livestock: profile.livestock,
      subCounty: saved.sub_county ?? "",
      ward: saved.ward ?? "",
      latitude: saved.latitude,
      longitude: saved.longitude,
      county: saved.county_id,
      profile_complete: Boolean(saved.latitude !== null && saved.longitude !== null),
    };
  },
  resetDemoProfile() {
    throw new Error("Reset demo profile is only available in mock mode.");
  },
};

export const farmerProfileService = selectAdapter(getDataMode(), mockAdapter, apiAdapter);
