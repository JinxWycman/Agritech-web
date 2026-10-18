import { getDataMode, getDemoScenario, getMockDelayMs } from "@/lib/data-mode";
import { farmerApi, getFarmerProfile, listCounties, listCropCatalogue, listLivestockCatalogue } from "@/lib/api";
import { countyFromCoordinates } from "@/lib/kenya-location";
import { persistDemoProfile, readDemoProfile, resetDemoProfile } from "@/lib/farmer-profile";
import { demoFarmerProfile } from "@/mocks/fixtures";
import { selectAdapter } from "@/services/selection";
import type { FarmerProfileService } from "@/services/contracts";
import type { CropEntry, ProfileCatalogue } from "@/types/domain";

// Demo catalogue: names double as IDs because mock mode has no backend records.
const demoCatalogue: ProfileCatalogue = {
  crops: ["Maize", "Beans", "Potatoes", "Vegetables", "Sorghum"].map((name) => ({ id: name, name })),
  livestock: ["Cattle", "Goats", "Sheep", "Poultry"].map((name) => ({ id: name, name })),
};

const mockAdapter: FarmerProfileService = {
  async getCatalogue() { return demoCatalogue; },
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

type BackendFarmerCrop = { id: string; crop_id: string; farm_size: number; soil_type: string; experience_level: string };
type BackendFarmerLivestock = { id: string; livestock_id: string; herd_size: number };

async function loadCatalogue(): Promise<ProfileCatalogue> {
  const [crops, livestock] = await Promise.all([listCropCatalogue(), listLivestockCatalogue()]);
  return { crops, livestock };
}

function totalAcres(entries: CropEntry[]): number | null {
  const total = entries.reduce((sum, entry) => sum + entry.farmSizeAcres, 0);
  return total > 0 ? Math.round(total * 100) / 100 : null;
}

const apiAdapter: FarmerProfileService = {
  getCatalogue: loadCatalogue,
  async getProfile() {
    const [profile, counties, crops, livestock, catalogue] = await Promise.all([
      getFarmerProfile(),
      listCounties(),
      farmerApi<BackendFarmerCrop[]>("/farmer-crops/"),
      farmerApi<BackendFarmerLivestock[]>("/farmer-livestock/"),
      loadCatalogue(),
    ]);
    const cropName = new Map(catalogue.crops.map((item) => [item.id, item.name]));
    const animalName = new Map(catalogue.livestock.map((item) => [item.id, item.name]));
    const cropEntries = crops.map((row) => ({
      cropId: row.crop_id, name: cropName.get(row.crop_id) ?? row.crop_id,
      farmSizeAcres: row.farm_size, soilType: row.soil_type, experienceLevel: row.experience_level,
    }));
    const livestockEntries = livestock.map((row) => ({
      livestockId: row.livestock_id, name: animalName.get(row.livestock_id) ?? row.livestock_id, herdSize: row.herd_size,
    }));
    return {
      farmSizeAcres: totalAcres(cropEntries),
      crops: cropEntries.map((entry) => entry.name),
      livestock: livestockEntries.map((entry) => entry.name),
      cropEntries,
      livestockEntries,
      subCounty: profile.sub_county ?? "",
      ward: profile.ward ?? "",
      countyId: profile.county_id,
      constituencyId: profile.constituency_id ?? "",
      wardId: profile.ward_id ?? "",
      latitude: profile.latitude,
      longitude: profile.longitude,
      county: counties.find((county) => county.id === profile.county_id)?.name ?? profile.county_id,
      profile_complete: Boolean(profile.latitude !== null && profile.longitude !== null && (cropEntries.length || livestockEntries.length)),
    };
  },
  async saveProfile(profile) {
    const saved = await farmerApi<Awaited<ReturnType<typeof getFarmerProfile>>>("/farmers/me", {
      method: "PUT",
      body: JSON.stringify({
        latitude: profile.latitude,
        longitude: profile.longitude,
        ...(profile.countyId ? { county_id: profile.countyId } : {}),
        ...(profile.constituencyId ? { constituency_id: profile.constituencyId } : {}),
        ...(profile.wardId ? { ward_id: profile.wardId } : {}),
      }),
    });

    // Records are unique per farmer and crop/animal and have no update route,
    // so a changed entry is replaced; unchanged entries are left alone.
    const [currentCrops, currentLivestock, counties] = await Promise.all([
      farmerApi<BackendFarmerCrop[]>("/farmer-crops/"),
      farmerApi<BackendFarmerLivestock[]>("/farmer-livestock/"),
      listCounties(),
    ]);
    const wantedCrops = new Map((profile.cropEntries ?? []).map((entry) => [entry.cropId, entry]));
    const wantedLivestock = new Map((profile.livestockEntries ?? []).map((entry) => [entry.livestockId, entry]));
    const keptCrops = new Set<string>();
    const keptLivestock = new Set<string>();
    const removals: Promise<unknown>[] = [];
    for (const row of currentCrops) {
      const wanted = wantedCrops.get(row.crop_id);
      if (wanted && wanted.farmSizeAcres === row.farm_size && wanted.soilType === row.soil_type && wanted.experienceLevel === row.experience_level) keptCrops.add(row.crop_id);
      else removals.push(farmerApi(`/farmer-crops/${row.id}`, { method: "DELETE" }));
    }
    for (const row of currentLivestock) {
      const wanted = wantedLivestock.get(row.livestock_id);
      if (wanted && wanted.herdSize === row.herd_size) keptLivestock.add(row.livestock_id);
      else removals.push(farmerApi(`/farmer-livestock/${row.id}`, { method: "DELETE" }));
    }
    await Promise.all(removals);
    await Promise.all([
      ...[...wantedCrops.values()].filter((entry) => !keptCrops.has(entry.cropId)).map((entry) => farmerApi("/farmer-crops/", {
        method: "POST",
        body: JSON.stringify({ crop_id: entry.cropId, farm_size: entry.farmSizeAcres, soil_type: entry.soilType, experience_level: entry.experienceLevel }),
      })),
      ...[...wantedLivestock.values()].filter((entry) => !keptLivestock.has(entry.livestockId)).map((entry) => farmerApi("/farmer-livestock/", {
        method: "POST",
        body: JSON.stringify({ livestock_id: entry.livestockId, herd_size: entry.herdSize }),
      })),
    ]);

    const cropEntries = profile.cropEntries ?? [];
    const livestockEntries = profile.livestockEntries ?? [];
    return {
      ...profile,
      farmSizeAcres: totalAcres(cropEntries),
      crops: cropEntries.map((entry) => entry.name),
      livestock: livestockEntries.map((entry) => entry.name),
      subCounty: saved.sub_county ?? "",
      ward: saved.ward ?? "",
      countyId: saved.county_id,
      constituencyId: saved.constituency_id ?? "",
      wardId: saved.ward_id ?? "",
      latitude: saved.latitude,
      longitude: saved.longitude,
      county: counties.find((county) => county.id === saved.county_id)?.name ?? saved.county_id,
      profile_complete: Boolean(saved.latitude !== null && saved.longitude !== null && (cropEntries.length || livestockEntries.length)),
    };
  },
  resetDemoProfile() {
    throw new Error("Reset demo profile is only available in mock mode.");
  },
};

export const farmerProfileService = selectAdapter(getDataMode(), mockAdapter, apiAdapter);
