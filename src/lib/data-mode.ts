export type DataMode = "mock" | "api";
export type DemoScenario = "success" | "empty" | "error";

export function getDataMode(): DataMode {
  return process.env.NEXT_PUBLIC_DATA_MODE === "api" ? "api" : "mock";
}

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL || "";
}

export function getDemoScenario(): DemoScenario {
  if (typeof document === "undefined") return "success";
  const value = document.cookie.match(/(?:^|; )demo_scenario=([^;]*)/)?.[1];
  return value === "empty" || value === "error" ? value : "success";
}

export function getMockDelayMs(): number {
  const value = Number(process.env.NEXT_PUBLIC_MOCK_DELAY_MS || "80");
  return Number.isFinite(value) ? Math.max(0, Math.min(value, 2000)) : 80;
}
