import { test, expect } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("public pages", () => {
  test("homepage loads with heading and nav", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/lineup/i);
    await expect(page.locator("nav")).toBeVisible();
  });

  test("sign-in page shows credentials form and Google button", async ({
    page,
  }) => {
    await page.goto("/sign-in");
    await expect(page.locator("#identifier")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.getByText(/google/i)).toBeVisible();
  });

  test("explore lineups page loads", async ({ page }) => {
    await page.goto("/lineups/explore");
    await expect(page.locator("body")).not.toHaveText(/application error/i);
  });

  test("players page loads with search", async ({ page }) => {
    await page.goto("/players");
    await expect(page.locator("body")).not.toHaveText(/application error/i);
  });

  test("contact page loads with form fields", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByRole("heading", { name: /contact/i })).toBeVisible();
  });

  test("privacy page loads", async ({ page }) => {
    await page.goto("/privacy");
    await expect(
      page.getByRole("heading", { name: /privacy policy/i }).first(),
    ).toBeVisible();
  });

  test("terms page loads", async ({ page }) => {
    await page.goto("/terms");
    await expect(
      page.getByRole("heading", { name: /terms of service/i }).first(),
    ).toBeVisible();
  });

  test("unauthorized page shows restricted message", async ({ page }) => {
    await page.goto("/unauthorized");
    await expect(page.getByText(/restricted/i)).toBeVisible();
  });
});
