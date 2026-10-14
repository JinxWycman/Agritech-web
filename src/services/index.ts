import { getDataMode } from "@/lib/data-mode";
import { selectAdapter } from "@/services/selection";
import { apiAuthService, apiAdminSummaryService, apiExpertRequestService, apiExpertsService, apiFarmerService, apiLifecycleExpertRequestService, apiLifecycleExpertsService, apiSymptomsService, apiRequestSettingsService } from "@/services/adapters/api";
import { mockAuthService, mockAdminSummaryService, mockExpertRequestService, mockExpertsService, mockFarmerService, mockLifecycleExpertRequestService, mockLifecycleExpertsService, mockSymptomsService, mockRequestSettingsService } from "@/services/adapters/mock";
import { farmerProfileService } from "@/services/farmer-profile";
import { farmConditionsService } from "@/services/farm-conditions";
import { farmerAlertsService, farmerRequestsService } from "@/services/farmer-counts";

const mode = getDataMode();

export const authService = selectAdapter(mode, mockAuthService, apiAuthService);
export const farmerService = selectAdapter(mode, mockFarmerService, apiFarmerService);
export const expertRequestService = selectAdapter(mode, mockExpertRequestService, apiExpertRequestService);
export const expertsService = selectAdapter(mode, mockExpertsService, apiExpertsService);
export const adminSummaryService = selectAdapter(mode, mockAdminSummaryService, apiAdminSummaryService);
export { farmerProfileService, farmConditionsService, farmerAlertsService, farmerRequestsService };
export const lifecycleExpertRequestService = selectAdapter(mode, mockLifecycleExpertRequestService, apiLifecycleExpertRequestService);
export const lifecycleExpertsService = selectAdapter(mode, mockLifecycleExpertsService, apiLifecycleExpertsService);
export const symptomsService = selectAdapter(mode, mockSymptomsService, apiSymptomsService);
export const requestSettingsService = selectAdapter(mode, mockRequestSettingsService, apiRequestSettingsService);

export function notImplemented(resource: string): never {
  throw new Error(`${resource} API adapter is not implemented until its backend contract is confirmed.`);
}
