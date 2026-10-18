import { getDataMode, getDemoScenario, getMockDelayMs } from "@/lib/data-mode";
import { notificationsService } from "@/services/notifications";
import { farmerApi } from "@/lib/api";
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
    const response = await farmerApi<{ unread_count: number }>("/notifications/unread-count");
    return response.unread_count;
  },
};
const apiRequests: FarmerRequestsService = {
  async getOpenCount() {
    const response = await farmerApi<{ total: number }>("/farmers/me/expert-requests?open=true&limit=1&offset=0");
    return response.total;
  },
};

export const farmerAlertsService = selectAdapter(getDataMode(), mockAlerts, apiAlerts);
export const farmerRequestsService = selectAdapter(getDataMode(), mockRequests, apiRequests);
