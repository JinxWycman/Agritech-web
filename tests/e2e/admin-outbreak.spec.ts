import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers";

test("admin previews and confirms a simulated outbreak alert", async ({ page }) => {
  await loginAs(page, "admin");
  await page.goto("/admin/outbreaks");
  await expect(page.getByRole("heading", { name: "Outbreak monitor" })).toBeVisible();
  await expect(page.locator(".leaflet-container")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Report clusters" })).toBeVisible();
  const history = page.locator("table tbody tr");
  const initialRows = await history.count();
  await page.getByRole("button").filter({ hasText: "Threshold reached" }).first().click();
  await expect(page.getByRole("heading", { name: "Review and send sample alert" })).toBeVisible();
  await page.getByLabel("Alert message in English").fill("Possible disease signs have been reported nearby. Check crops and contact an expert.");
  await page.getByLabel("Alert message in Kiswahili").fill("Dalili za ugonjwa zimeripotiwa karibu. Kagua mazao na wasiliana na mtaalamu.");
  await page.getByRole("button", { name: "Preview recipients" }).click();
  await expect(page.getByText("Simulated: no SMS is sent.")).toBeVisible();
  await page.getByRole("button", { name: "Review alert" }).click();
  await page.getByRole("button", { name: "Confirm simulated send" }).click();
  await expect(history).toHaveCount(initialRows + 1);
});
