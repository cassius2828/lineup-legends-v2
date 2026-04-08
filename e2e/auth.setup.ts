import { test as setup, expect } from "@playwright/test";

const authFile = "e2e/.auth/user.json";

setup("authenticate as test user", async ({ page }) => {
  await page.goto("/sign-in");

  await page.locator("#identifier").fill("e2e-test@lineuplegends.dev");
  await page.locator("#password").fill("TestPassword123!");
  await page.locator('button[type="submit"]').click();

  await expect(page).not.toHaveURL(/sign-in/);

  await page.context().storageState({ path: authFile });
});
