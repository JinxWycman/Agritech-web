import { getDataMode, getDemoScenario, getMockDelayMs } from "@/lib/data-mode";
import { getFarmerProfile } from "@/lib/api";
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
    const profile = await getFarmerProfile();
    return {
      farmSizeAcres: null,
      crops: [],
      livestock: [],
      subCounty: "",
      ward: "",
      latitude: null,
      longitude: null,
      county: profile.county_id,
      profile_complete: false,
    };
  },
  async saveProfile() {
    throw new Error("Farmer profile writes and farm location fields are not implemented until their backend contract is confirmed.");
  },
  resetDemoProfile() {
    throw new Error("Reset demo profile is only available in mock mode.");
  },
};

export const farmerProfileService = selectAdapter(getDataMode(), mockAdapter, apiAdapter);
