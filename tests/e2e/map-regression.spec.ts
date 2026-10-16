import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers";

declare global {
  interface Window { __cspViolations: string[] }
}

test("all interactive maps have a visible canvas and no CSP violations", async ({ page }) => {
  const policyErrors: string[] = [];
  const violations: string[] = [];
  await page.addInitScript(() => {
    window.__cspViolations = [];
    window.addEventListener("securitypolicyviolation", (event) => {
      window.__cspViolations.push(`${event.violatedDirective}: ${event.blockedURI}`);
    });
  });
  page.on("console", (message) => {
    if (message.type() === "error" && /Content Security Policy|Refused to load/i.test(message.text())) policyErrors.push(message.text());
  });
  page.on("pageerror", (error) => {
    if (/Content Security Policy|Refused to load/i.test(error.message)) policyErrors.push(error.message);
  });

  const routes = [
    { role: "farmer" as const, path: "/app/profile" },
    { role: "farmer" as const, path: "/app/agrovets" },
    { role: "farmer" as const, path: "/app/risks" },
    { role: "admin" as const, path: "/admin/outbreaks" },
  ];
  for (const route of routes) {
    await page.context().clearCookies();
    await loginAs(page, route.role);
    await page.goto(route.path);
    const map = page.locator(".leaflet-container").first();
    await expect(map).toBeVisible({ timeout: 15000 });
    const box = await map.boundingBox();
    violations.push(...await page.evaluate(() => window.__cspViolations));
    expect(box?.height ?? 0, `${route.path} map should have a non-collapsed height`).toBeGreaterThanOrEqual(150);
  }

  expect(violations).toEqual([]);
  expect(policyErrors).toEqual([]);
});
