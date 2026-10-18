import type { Page } from "@playwright/test";

export type DemoPersona = "farmer" | "expert" | "admin";

const demoLoginNames: Record<DemoPersona, string> = {
  farmer: "Continue as demo Farmer",
  expert: "Continue as demo Expert",
  admin: "Continue as demo Admin",
};

export async function loginAs(page: Page, persona: DemoPersona) {
  await page.goto("/login");
  // Demo personas sit behind a disclosure below the single sign-in form.
  await page.getByText("Demo accounts", { exact: true }).click();
  await page.getByRole("button", { name: demoLoginNames[persona] }).click();
  const destination = persona === "farmer" ? "/app/" : persona === "expert" ? "/expert/" : "/admin/";
  await page.waitForURL((url) => url.pathname.startsWith(destination));
}

export async function openDemoControls(page: Page) {
  const details = page.locator("details").filter({ has: page.getByText("Demo controls", { exact: true }) });
  const isOpen = await details.evaluate((element) => (element as HTMLDetailsElement).open);
  if (!isOpen) await details.locator("summary").click();
  return details;
}
