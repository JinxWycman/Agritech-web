import { expect, test } from "@playwright/test";
import { loginAs, openDemoControls } from "./helpers";

test("farmer request progresses through expert acceptance", async ({ page }) => {
  await loginAs(page, "farmer");
  await page.goto("/app/profile");
  await page.getByLabel("Latitude").fill("-1.2921");
  await page.getByLabel("Longitude").fill("36.8219");
  await page.getByRole("button", { name: "Save farm profile" }).click();
  await expect(page.getByRole("status")).toBeVisible();

  await page.goto("/app/requests/new");
  await page.getByRole("button", { name: "Yellow leaves", exact: true }).click();
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page).toHaveURL(/\/app\/requests\/[^/]+$/);
  const detailUrl = page.url();
  await expect(page.getByText(/AGR-[A-Z0-9-]+/)).toBeVisible();
  await expect(page.getByText("Pending", { exact: true })).toBeVisible();
  await expect(page.getByText("Accepted expert phone")).toHaveCount(0);

  const controls = await openDemoControls(page);
  await controls.getByRole("button", { name: "Act as expert" }).click();
  await expect(page).toHaveURL(/\/expert\/overview$/);
  await expect(page.getByRole("button", { name: "Accept", exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Accept", exact: true }).first().click();
  await expect(page.getByRole("status")).toBeVisible();

  const expertControls = await openDemoControls(page);
  await expertControls.getByLabel("Demo persona").selectOption("farmer");
  await expect(page).toHaveURL(/\/app\/overview$/);
  await page.goto(detailUrl);
  await expect(page.getByText("Accepted", { exact: true })).toBeVisible();
  await expect(page.getByText("Accepted expert phone")).toBeVisible();
});
