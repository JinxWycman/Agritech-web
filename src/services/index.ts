import { getDataMode } from "@/lib/data-mode";
import { selectAdapter } from "@/services/selection";
import { apiAuthService, apiAdminSummaryService, apiExpertRequestService, apiExpertsService, apiFarmerService, apiLifecycleExpertRequestService, apiLifecycleExpertsService, apiSymptomsService, apiRequestSettingsService, apiRecommendationService, apiVendorService } from "@/services/adapters/api";
import { mockAuthService, mockAdminSummaryService, mockExpertRequestService, mockExpertsService, mockFarmerService, mockLifecycleExpertRequestService, mockLifecycleExpertsService, mockSymptomsService, mockRequestSettingsService, mockRecommendationService, mockVendorService } from "@/services/adapters/mock";
import { farmerProfileService } from "@/services/farmer-profile";
import { farmConditionsService } from "@/services/farm-conditions";
import { farmerAlertsService, farmerRequestsService } from "@/services/farmer-counts";
import { marketPriceService } from "@/services/market-prices";
import { outbreakService } from "@/services/outbreaks";
import { notificationsService } from "@/services/notifications";
import { subscriptionService } from "@/services/subscription";
import { notificationPreferencesService } from "@/services/notification-preferences";
import { expertPerformanceService } from "@/services/expert-performance";
import { expertCoverageService } from "@/services/expert-coverage";

const mode = getDataMode();

export const authService = selectAdapter(mode, mockAuthService, apiAuthService);
export const farmerService = selectAdapter(mode, mockFarmerService, apiFarmerService);
export const expertRequestService = selectAdapter(mode, mockExpertRequestService, apiExpertRequestService);
export const expertsService = selectAdapter(mode, mockExpertsService, apiExpertsService);
export const adminSummaryService = selectAdapter(mode, mockAdminSummaryService, apiAdminSummaryService);
export { farmerProfileService, farmConditionsService, farmerAlertsService, farmerRequestsService, outbreakService, notificationsService, subscriptionService, notificationPreferencesService, expertPerformanceService, expertCoverageService };
export const lifecycleExpertRequestService = selectAdapter(mode, mockLifecycleExpertRequestService, apiLifecycleExpertRequestService);
export const lifecycleExpertsService = selectAdapter(mode, mockLifecycleExpertsService, apiLifecycleExpertsService);
export const symptomsService = selectAdapter(mode, mockSymptomsService, apiSymptomsService);
export const requestSettingsService = selectAdapter(mode, mockRequestSettingsService, apiRequestSettingsService);
export const recommendationService = selectAdapter(mode, mockRecommendationService, apiRecommendationService);
export const vendorService = selectAdapter(mode, mockVendorService, apiVendorService);
export { marketPriceService };

export function notImplemented(resource: string): never {
  throw new Error(`${resource} API adapter is not implemented until its backend contract is confirmed.`);
}
