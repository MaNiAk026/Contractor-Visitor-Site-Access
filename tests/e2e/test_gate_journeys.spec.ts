import { expect, test } from "@playwright/test";

const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:3000";

/**
 * Starts a deterministic gate-operator browser session through the application UI.
 *
 * The test environment must be reset and seeded before each Playwright command so
 * entry events and audit evidence remain independent across runs.
 */
async function signInAsGateOperator(page: import("@playwright/test").Page): Promise<void> {
  await page.goto(`${baseUrl}/login`);
  await page.locator("#email").selectOption("gate@demo.renewi.local");
  await page.locator("#role").selectOption("gate_operator");
  await page.getByRole("button", { name: /open demo workspace/i }).click();
  await expect(page.getByRole("heading", { name: /scan access pass/i })).toBeVisible();
}

test.describe("deterministic local gate journeys", () => {
  test("records an explainable grant and entry for the compliant seeded opaque pass", async ({ page }) => {
    await signInAsGateOperator(page);

    await page.getByRole("button", { name: /verify access/i }).click();

    await expect(page.getByRole("heading", { name: "Access granted" })).toBeVisible();
    await expect(page.getByText("Nora Jansen")).toBeVisible();
    await expect(page.getByText("Mock verification matched")).toBeVisible();
    await expect(page.getByText("No blacklist entry applies.")).toBeVisible();

    await page.getByRole("button", { name: /record entry/i }).click();

    await expect(page.getByText(/entry at gate 2 recorded in the gate and audit logs/i)).toBeVisible();
  });

  test("denies an expired-evidence authorization with its audit-ready reason", async ({ page }) => {
    await signInAsGateOperator(page);

    await page.locator("#gate-token").fill("qr_demo_expired_9c2d");
    await page.getByRole("button", { name: /verify access/i }).click();

    await expect(page.getByRole("heading", { name: "Access denied" })).toBeVisible();
    await expect(
      page.getByText("Mandatory evidence is expired and requires renewal.")
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /record entry/i })).toHaveCount(0);
  });

  test("denies a blacklisted person and an identity mismatch without exposing gate actions", async ({ page }) => {
    await signInAsGateOperator(page);

    await page.locator("#gate-token").fill("qr_demo_blocked_5b1e");
    await page.getByRole("button", { name: /verify access/i }).click();
    await expect(page.getByText("An active blacklist entry blocks access.")).toBeVisible();
    await expect(page.getByRole("button", { name: /record entry/i })).toHaveCount(0);

    await page.locator("#gate-token").fill("qr_demo_mismatch_8a20");
    await page.getByRole("button", { name: /verify access/i }).click();
    await expect(
      page.getByText("Mock identity verification did not match the presented identifier.")
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /record entry/i })).toHaveCount(0);
  });
});
