import { getDataMode, getDemoScenario, getMockDelayMs } from "@/lib/data-mode";
import { demoFarmConditions } from "@/mocks/fixtures";
import { selectAdapter } from "@/services/selection";
import type { FarmConditionsService } from "@/services/contracts";

const mockAdapter: FarmConditionsService = {
  async getSnapshot(latitude, longitude) {
    await new Promise((resolve) => setTimeout(resolve, getMockDelayMs()));
    const scenario = getDemoScenario();
    if (scenario === "error") throw new Error("Demo service error scenario.");
    if (scenario === "empty") return null;
    return { ...demoFarmConditions, latitude, longitude };
  },
};

const apiAdapter: FarmConditionsService = {
  async getSnapshot() {
    throw new Error("Farm conditions API adapter is not implemented until its backend contract is confirmed.");
  },
};

export const farmConditionsService = selectAdapter(getDataMode(), mockAdapter, apiAdapter);
