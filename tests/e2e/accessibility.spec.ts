import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { loginAs, type DemoPersona } from "./helpers";

const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];
const routes: { path: string; persona: DemoPersona | null }[] = [
  { path: "/login", persona: null },
  { path: "/app/overview", persona: "farmer" },
  { path: "/app/profile", persona: "farmer" },
  { path: "/app/requests/new", persona: "farmer" },
  { path: "/app/recommendations", persona: "farmer" },
  { path: "/app/agrovets", persona: "farmer" },
  { path: "/app/market-prices", persona: "farmer" },
  { path: "/app/risks", persona: "farmer" },
  { path: "/app/notifications", persona: "farmer" },
  { path: "/app/subscription", persona: "farmer" },
  { path: "/app/settings", persona: "farmer" },
  { path: "/expert/overview", persona: "expert" },
  { path: "/expert/performance", persona: "expert" },
  { path: "/expert/availability", persona: "expert" },
  { path: "/admin/overview", persona: "admin" },
  { path: "/admin/requests", persona: "admin" },
  { path: "/admin/outbreaks", persona: "admin" },
];
const themeRoutes = new Set(["/login", "/app/overview", "/app/requests/new", "/admin/outbreaks"]);

async function prepareRoute(page: Page, path: string, persona: DemoPersona | null, theme?: "light" | "dark") {
  await page.context().clearCookies();
  await page.goto("/login");
  await page.evaluate(() => localStorage.clear());
  if (persona) await loginAs(page, persona);
  await page.goto(path);
  if (theme) await page.getByLabel("Theme").selectOption(theme);
}

test("critical user routes have no serious or critical axe findings", async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  const counts = { serious: 0, critical: 0, moderate: 0, minor: 0 };
  const failures: string[] = [];
  const projectName = testInfo.project.name;
  for (const route of routes) {
    const themes = themeRoutes.has(route.path) ? ["light", "dark"] as const : [undefined];
    for (const theme of themes) {
      await prepareRoute(page, route.path, route.persona, theme);
      const result = await new AxeBuilder({ page }).withTags(tags).exclude(".leaflet-container").analyze();
      for (const violation of result.violations) {
        counts[violation.impact || "minor"] += violation.nodes.length;
        if (violation.impact === "serious" || violation.impact === "critical") {
          failures.push(`${projectName} ${route.path} ${theme ?? "default"}: ${violation.id} ${violation.help} (${violation.nodes.length})`);
        }
      }
    }
  }
  console.log(`AXE_COUNTS ${projectName} ${JSON.stringify(counts)}`);
  testInfo.annotations.push({ type: "axe-counts", description: JSON.stringify(counts) });
  expect(failures, failures.join("\n")).toEqual([]);
});
