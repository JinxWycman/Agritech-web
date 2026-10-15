import { getDataMode } from "@/lib/data-mode";
import { currentDemoExpertId, readRequestStore, writeRequestStore } from "@/lib/request-store";
import { serviceAreasSchema } from "@/lib/account-validation";
import { selectAdapter } from "@/services/selection";
import { COUNTY_CENTRES } from "@/lib/kenya-location";
import type { ServiceAreas } from "@/types/account";

export const expertCounties = COUNTY_CENTRES.map((county) => county.name);
export type ExpertCoverageService = { get(): Promise<ServiceAreas>; save(value: ServiceAreas): Promise<ServiceAreas> };
function storedAreas(): ServiceAreas {
  const expert = readRequestStore().experts.find((item) => item.id === currentDemoExpertId());
  const value: unknown = expert && "serviceAreas" in expert ? expert.serviceAreas : undefined;
  const parsed = serviceAreasSchema.safeParse(value ?? { counties: [], subCounties: [] });
  if (!parsed.success) throw new Error("Saved expert coverage is invalid.");
  return parsed.data;
}
const mockAdapter: ExpertCoverageService = {
  async get() { return storedAreas(); },
  async save(value) {
    const parsed = serviceAreasSchema.parse(value);
    const store = readRequestStore();
    const expertId = currentDemoExpertId();
    writeRequestStore({ ...store, experts: store.experts.map((expert) => expert.id === expertId ? { ...expert, serviceAreas: parsed } : expert) });
    return parsed;
  },
};
const apiAdapter: ExpertCoverageService = {
  async get() { throw new Error("Expert coverage API adapter is not implemented; PATCH /admin/me/availability currently covers availability only."); },
  async save() { throw new Error("Expert coverage API adapter is not implemented; service-area contract is not confirmed."); },
};
export const expertCoverageService = selectAdapter(getDataMode(), mockAdapter, apiAdapter);
