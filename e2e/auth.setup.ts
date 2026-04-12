import { test as setup, expect } from "@playwright/test";

const authFile = "e2e/.auth/user.json";

setup("authenticate as test user", async ({ page }) => {
  await page.goto("/sign-in");

  // Wait for React hydration — form only renders after Suspense resolves
  const identifierInput = page.locator("#identifier");
  await identifierInput.waitFor({ state: "visible", timeout: 30_000 });

  await identifierInput.fill("e2e-test@lineuplegends.dev");
  await page.locator("#password").fill("TestPassword123!");
  await page.locator('button[type="submit"]').click();

  // Generous timeout: CI cold-starts NextAuth API routes on first request
  await expect(page).not.toHaveURL(/sign-in/, { timeout: 30_000 });

  await page.context().storageState({ path: authFile });
});
