import type { DemoScenario } from "@/lib/data-mode";

export async function resolveScenario<T>(scenario: DemoScenario, value: T, emptyValue: T): Promise<T> {
  if (scenario === "error") throw new Error("Demo service error scenario.");
  if (scenario === "empty") return emptyValue;
  return value;
}
