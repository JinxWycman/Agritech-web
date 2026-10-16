import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:3100";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  reporter: "line",
  retries: 0,
  use: { baseURL, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], viewport: { width: 360, height: 740 } },
      testMatch: ["farmer-lifecycle.spec.ts", "accessibility.spec.ts"],
    },
  ],
  webServer: {
    command: "npm run build && npx next start -p 3100",
    url: baseURL,
    reuseExistingServer: false,
    timeout: 300_000,
    env: {
      NEXT_PUBLIC_DATA_MODE: "mock",
      NEXT_PUBLIC_DEMO_ENABLED: "true",
      NEXT_DIST_DIR: ".next-e2e",
    },
  },
});
