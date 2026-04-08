import { test, expect } from "@playwright/test";

test.describe("authenticated flows", () => {
  test("my lineups page loads (not redirected to sign-in)", async ({
    page,
  }) => {
    await page.goto("/lineups");
    await expect(page).not.toHaveURL(/sign-in/);
    await expect(page.locator("body")).not.toHaveText(/application error/i);
  });

  test("create lineup page loads with player selector", async ({ page }) => {
    await page.goto("/lineups/new");
    await expect(page).not.toHaveURL(/sign-in/);
    await expect(page.locator("body")).not.toHaveText(/application error/i);
  });

  test("nav shows profile link and no admin link", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator("nav");
    await expect(nav).toBeVisible();
    await expect(nav.getByText(/admin/i)).not.toBeVisible();
  });
});
