import { describe, expect, it } from "vitest";
import { isDemoAllowed, isProductionConfigured } from "@/lib/data-mode";
import { selectAdapter } from "@/services/selection";

describe("production safety configuration", () => {
  it("allows demo outside production or when explicitly enabled", () => {
    expect(isDemoAllowed("development", undefined)).toBe(true);
    expect(isDemoAllowed("test", "false")).toBe(true);
    expect(isDemoAllowed("production", "true")).toBe(true);
    expect(isDemoAllowed("production", "false")).toBe(false);
    expect(isDemoAllowed("production", undefined)).toBe(false);
  });

  it("fails closed for unset mode and unapproved production mock mode", () => {
    const config = (dataMode: string | undefined, demoEnabled?: string, apiBaseUrl?: string) => isProductionConfigured({ nodeEnv: "production", dataMode, demoEnabled, apiBaseUrl });
    expect(config(undefined)).toBe(false);
    expect(config("mock")).toBe(false);
    expect(config("mock", "false")).toBe(false);
    expect(config("mock", "true")).toBe(true);
    expect(config("api", undefined, "https://api.example.test")).toBe(true);
    expect(config("api", undefined, "")).toBe(false);
    expect(isProductionConfigured({ nodeEnv: "development", dataMode: undefined, demoEnabled: undefined, apiBaseUrl: undefined })).toBe(true);
  });

  it("selects the API adapter in API mode", () => {
    const mock = { source: "mock" };
    const api = { source: "api" };
    expect(selectAdapter("api", mock, api)).toBe(api);
  });
});
