import { getDataMode, getDemoScenario, getMockDelayMs } from "@/lib/data-mode";
import { notificationsService } from "@/services/notifications";
import { readLifecycleRequests } from "@/lib/request-store";
import { selectAdapter } from "@/services/selection";
import type { FarmerAlertsService, FarmerRequestsService } from "@/services/contracts";

const mockAlerts: FarmerAlertsService = { getUnreadCount: () => notificationsService.getUnreadCount() };
const mockRequests: FarmerRequestsService = {
  async getOpenCount() {
    await new Promise((resolve) => setTimeout(resolve, getMockDelayMs()));
    if (getDemoScenario() === "error") throw new Error("Demo service error scenario.");
    if (getDemoScenario() === "empty") return 0;
    return readLifecycleRequests().filter((request) => request.farmerId === "demo-farmer-1" && !["completed", "cancelled"].includes(request.status)).length;
  },
};
const apiAlerts: FarmerAlertsService = {
  async getUnreadCount() {
    throw new Error("Farmer unread notifications count API adapter is not implemented until its backend contract is confirmed.");
  },
};
const apiRequests: FarmerRequestsService = {
  async getOpenCount() {
    throw new Error("Farmer open expert request count API adapter is not implemented until its backend contract is confirmed.");
  },
};

export const farmerAlertsService = selectAdapter(getDataMode(), mockAlerts, apiAlerts);
export const farmerRequestsService = selectAdapter(getDataMode(), mockRequests, apiRequests);
