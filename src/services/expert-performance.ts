import { getDataMode, getDemoScenario, getMockDelayMs } from "@/lib/data-mode";
import { readLifecycleRequests } from "@/lib/request-store";
import { computePerformance } from "@/lib/expert-performance";
import { selectAdapter } from "@/services/selection";
import type { ExpertRequestRecord } from "@/lib/request-lifecycle";
import type { ExpertPerformance } from "@/types/account";

export type ExpertPerformanceService = { get(expertId: string): Promise<ExpertPerformance>; listRecentCompleted(expertId: string): Promise<ExpertRequestRecord[]> };
async function requestsForExpert(): Promise<ExpertRequestRecord[]> {
  await new Promise((resolve) => setTimeout(resolve, getMockDelayMs()));
  if (getDemoScenario() === "error") throw new Error("Demo expert performance could not be loaded.");
  if (getDemoScenario() === "empty") return [];
  return readLifecycleRequests();
}
const mockAdapter: ExpertPerformanceService = {
  async get(expertId) { return computePerformance(await requestsForExpert(), expertId); },
  async listRecentCompleted(expertId) { return (await requestsForExpert()).filter((request) => request.assignedExpertId === expertId && request.status === "completed").sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 20); },
};
const apiAdapter: ExpertPerformanceService = {
  async get() { throw new Error("Expert performance API adapter is not implemented until its aggregate contract is confirmed."); },
  async listRecentCompleted() { throw new Error("Expert performance API adapter is not implemented until its contract is confirmed."); },
};
export const expertPerformanceService = selectAdapter(getDataMode(), mockAdapter, apiAdapter);
