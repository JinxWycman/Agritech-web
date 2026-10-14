import { getDataMode, getDemoScenario, getMockDelayMs } from "@/lib/data-mode";
import type { ResourceService } from "@/services/contracts";
import { selectAdapter } from "@/services/selection";

function notImplemented(resource: string): never {
  throw new Error(`${resource} API adapter is not implemented until its backend contract is confirmed.`);
}

export function resourceAdapters<T>(resource: string, fixtures: T[] = []): { mock: ResourceService<T>; api: ResourceService<T> } {
  const mock: ResourceService<T> = {
    async list() {
      await new Promise((resolve) => setTimeout(resolve, getMockDelayMs()));
      if (getDemoScenario() === "error") throw new Error("Demo service error scenario.");
      return getDemoScenario() === "empty" ? [] : fixtures;
    },
  };
  const api: ResourceService<T> = { async list() { return notImplemented(resource); } };
  return { mock, api };
}

export function resourceStub<T>(resource: string, fixtures: T[] = []): ResourceService<T> {
  const adapters = resourceAdapters(resource, fixtures);
  return selectAdapter(getDataMode(), adapters.mock, adapters.api);
}
