export type DataMode = "mock" | "api";
export type DemoScenario = "success" | "empty" | "error";

export function isDemoAllowed(nodeEnv = process.env.NODE_ENV, demoEnabled = process.env.NEXT_PUBLIC_DEMO_ENABLED): boolean {
  return nodeEnv !== "production" || demoEnabled === "true";
}

export function isProductionConfigured({
  nodeEnv,
  dataMode,
  demoEnabled,
  apiBaseUrl,
}: {
  nodeEnv: string | undefined;
  dataMode: string | undefined;
  demoEnabled: string | undefined;
  apiBaseUrl: string | undefined;
}): boolean {
  if (nodeEnv !== "production") return true;
  if (dataMode === "mock") return isDemoAllowed(nodeEnv, demoEnabled);
  if (dataMode === "api") return Boolean(apiBaseUrl?.trim());
  return false;
}

export function getDataMode(): DataMode {
  return process.env.NEXT_PUBLIC_DATA_MODE === "api" ? "api" : "mock";
}

export function getApiBaseUrl(): string {
  return process.env.API_URL || "";
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
