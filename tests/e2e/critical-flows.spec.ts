import { expect, test } from "@playwright/test";
import { loginAs, openDemoControls } from "./helpers";

test("language selection persists across reload", async ({ page }) => {
  await loginAs(page, "farmer");
  await page.goto("/app/overview");
  const englishHeading = await page.getByRole("heading", { level: 1 }).innerText();
  await page.getByLabel("Language").selectOption("sw");
  await expect.poll(() => page.getByRole("heading", { level: 1 }).innerText()).not.toBe(englishHeading);
  const swahiliHeading = await page.getByRole("heading", { level: 1 }).innerText();
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(swahiliHeading);
});

test("demo error and empty scenarios show recoverable states", async ({ page }) => {
  await loginAs(page, "farmer");
  let controls = await openDemoControls(page);
  await controls.getByLabel("Data scenario").selectOption("error");
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  controls = await openDemoControls(page);
  await controls.getByLabel("Data scenario").selectOption("empty");
  await page.goto("/app/overview");
  await expect(page.getByText(/try the success scenario|no information yet/i).first()).toBeVisible();
});

test("route guards redirect anonymous and wrong-role visitors", async ({ page }) => {
  await page.goto("/admin/overview");
  await expect(page).toHaveURL(/\/login/);
  await loginAs(page, "farmer");
  await page.goto("/admin/overview");
  await expect(page).toHaveURL(/\/app\/overview$/);
  await page.goto("/farmer/overview");
  await expect(page).toHaveURL(/\/app\/overview$/);
});

test("manifest and production service worker are available and register", async ({ page }) => {
  const manifest = await page.request.get("/manifest.webmanifest");
  expect(manifest.ok()).toBeTruthy();
  const manifestJson = await manifest.json();
  expect(manifestJson.name).toBe("Agritech AI");
  expect(manifestJson.icons.length).toBeGreaterThan(0);

  const workerResponse = await page.request.get("/sw.js");
  expect(workerResponse.ok()).toBeTruthy();
  expect(workerResponse.headers()["cache-control"]).toContain("no-cache");
  await page.goto("/login");
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.getRegistrations().then((registrations) => registrations.length)), { timeout: 10000 }).toBeGreaterThan(0);

  await loginAs(page, "farmer");
  await page.goto("/app/overview");
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null), { timeout: 10000 }).toBe(true);
  await page.context().setOffline(true);
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await expect(page.getByRole("heading", { name: "You are offline" })).toBeVisible({ timeout: 10000 });
});

test("keyboard can skip to and focus the main content", async ({ page }) => {
  await page.goto("/login");
  await page.keyboard.press("Tab");
  await expect(page.locator("a[href=\"#main\"]")).toBeFocused();
  await expect(page.locator("a[href=\"#main\"]")).toHaveText("Skip to main content");
  await page.keyboard.press("Enter");
  await expect(page.locator("main#main")).toBeFocused();
});
