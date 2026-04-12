import { test, expect } from "@playwright/test";

test.describe("authenticated navigation", () => {
  test("nav shows authenticated links", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator("nav");
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link", { name: "Players" })).toBeVisible();
    await expect(
      nav.getByRole("link", { name: /create a lineup/i }),
    ).toBeVisible();
    await expect(nav.getByRole("link", { name: "Explore" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "My Lineups" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Find Users" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Contact" })).toBeVisible();
    await expect(nav.getByText(/admin/i)).not.toBeVisible();
  });
});

test.describe("my lineups page", () => {
  test("loads with heading and action links", async ({ page }) => {
    await page.goto("/lineups");
    await expect(page).not.toHaveURL(/sign-in/);
    await expect(
      page.getByRole("heading", { name: "My Lineups" }),
    ).toBeVisible();
    await expect(
      page.getByText("Manage your fantasy basketball"),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Explore Lineups" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Create Lineup/i }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Bookmarked" })).toBeVisible();
  });

  test("sort buttons are visible", async ({ page }) => {
    await page.goto("/lineups");
    await expect(page.getByRole("button", { name: "Newest" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Oldest" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Highest Rated" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Most Rated" }),
    ).toBeVisible();
  });

  test("view toggle buttons are visible", async ({ page }) => {
    await page.goto("/lineups");
    await expect(page.getByRole("button", { name: "List view" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Grid view" })).toBeVisible();
  });
});

test.describe("explore lineups page", () => {
  test("loads with heading and community description", async ({ page }) => {
    await page.goto("/lineups/explore");
    await expect(
      page.getByRole("heading", { name: "Explore Lineups" }),
    ).toBeVisible();
    await expect(
      page.getByText("Discover lineups from the community"),
    ).toBeVisible();
  });

  test("has navigation links back to my lineups", async ({ page }) => {
    await page.goto("/lineups/explore");
    await expect(page.getByRole("link", { name: "My Lineups" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Create Lineup/i }),
    ).toBeVisible();
  });
});

test.describe("player search", () => {
  test("search for curry returns results", async ({ page }) => {
    await page.goto("/players");
    await expect(page.getByRole("heading", { name: "Players" })).toBeVisible();

    await expect(page.getByText(/Showing \d+ of/i)).toBeVisible({
      timeout: 30_000,
    });

    const searchInput = page.getByPlaceholder("Search by player name...");
    await searchInput.fill("curry");
    await expect(page.getByText(/\d+ player.*found/i)).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("No players found")).not.toBeVisible();
    await expect(page.getByText(/Curry/).first()).toBeVisible();
  });

  test("value filter buttons work", async ({ page }) => {
    await page.goto("/players");

    await expect(page.getByText(/Showing \d+ of/i)).toBeVisible({
      timeout: 30_000,
    });

    await expect(
      page.getByRole("button", { name: "All", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /\$5.*Diamond/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /\$1.*Bronze/i }),
    ).toBeVisible();

    await page.getByRole("button", { name: /\$5.*Diamond/i }).click();
    await expect(page.getByText(/Showing|found/i).first()).toBeVisible({
      timeout: 10_000,
    });
  });
});

test.describe("player detail page", () => {
  async function searchAndNavigateToCurry(
    page: import("@playwright/test").Page,
  ) {
    await page.goto("/players");
    await expect(page.getByText(/Showing \d+ of/i)).toBeVisible({
      timeout: 30_000,
    });
    const searchInput = page.getByPlaceholder("Search by player name...");
    await searchInput.fill("curry");
    await expect(page.getByText(/\d+ player.*found/i)).toBeVisible({
      timeout: 10_000,
    });
    const curryImage = page.getByRole("img", { name: /curry/i }).first();
    await expect(curryImage).toBeVisible({ timeout: 10_000 });
    await curryImage.click();
    await expect(page).toHaveURL(/\/players\//, { timeout: 10_000 });
  }

  test("navigate to player detail via search", async ({ page }) => {
    await searchAndNavigateToCurry(page);
    await expect(
      page.getByRole("heading", { level: 1, name: /curry/i }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("player detail shows biography and tier", async ({ page }) => {
    await searchAndNavigateToCurry(page);

    await expect(
      page.getByText(/Diamond|Amethyst|Gold|Silver|Bronze/).first(),
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/\$[1-5]/).first()).toBeVisible();

    await expect(page.getByRole("heading", { name: /biography/i })).toBeVisible(
      { timeout: 30_000 },
    );
  });

  test("player detail shows career stats when wiki loads", async ({ page }) => {
    await searchAndNavigateToCurry(page);

    const statsSection = page.locator('[aria-label="Career statistics"]');
    await expect(statsSection).toBeVisible({ timeout: 45_000 });
    await expect(
      statsSection.getByText(/career averages|career bests/i),
    ).toBeVisible();
  });

  test("player detail shows measurements when available", async ({ page }) => {
    await searchAndNavigateToCurry(page);

    const measurements = page.locator(
      '[aria-label="Listed height and weight from Wikipedia"]',
    );
    await expect(measurements).toBeVisible({ timeout: 30_000 });
    await expect(measurements.getByText(/height/i)).toBeVisible();
  });
});

test.describe("create lineup", () => {
  test("page loads with grid and budget", async ({ page }) => {
    await page.goto("/lineups/new");
    await expect(page).not.toHaveURL(/sign-in/);
    await expect(
      page.getByRole("heading", { name: /Build Your Starting 5/i }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("$15")).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Back to My Lineups/i }),
    ).toBeVisible();
  });

  test("all five tier rows are visible", async ({ page }) => {
    await page.goto("/lineups/new");
    await expect(
      page.getByRole("heading", { name: /Build Your Starting 5/i }),
    ).toBeVisible({ timeout: 15_000 });

    for (const label of ["$5", "$4", "$3", "$2", "$1"]) {
      await expect(
        page.getByRole("heading", { name: label, exact: true }),
      ).toBeVisible();
    }
  });

  test("select one player from each tier fills all 5 slots", async ({
    page,
  }) => {
    await page.goto("/lineups/new");
    await expect(
      page.getByRole("heading", { name: /Build Your Starting 5/i }),
    ).toBeVisible({ timeout: 15_000 });

    const tierLabels = ["$5", "$4", "$3", "$2", "$1"];
    for (const label of tierLabels) {
      const tierRow = page.locator("div.flex.items-start").filter({
        has: page.getByRole("heading", { name: label, exact: true }),
      });
      const playerButtons = tierRow.locator('button[type="button"]');
      await playerButtons.first().click();
    }

    await expect(page.getByText("$0")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Confirm Lineup" }),
    ).toBeEnabled();
  });

  test("player details panel opens with stats", async ({ page }) => {
    await page.goto("/lineups/new");
    await expect(
      page.getByRole("heading", { name: /Build Your Starting 5/i }),
    ).toBeVisible({ timeout: 15_000 });

    const firstTierRow = page.locator("div.flex.items-start").filter({
      has: page.getByRole("heading", { name: "$5", exact: true }),
    });
    await firstTierRow.locator('button[type="button"]').first().click();

    await page.getByRole("button", { name: "Player details" }).click();

    const panel = page.getByRole("dialog");
    await expect(panel).toBeVisible();
    await expect(panel.locator("#player-detail-title")).toBeVisible();
    await expect(panel.getByText(/Fantasy value/i)).toBeVisible();
    await expect(panel.getByText(/\$[1-5]/)).toBeVisible();

    const statsSection = panel.locator('[aria-label="Career statistics"]');
    await expect(statsSection).toBeVisible({ timeout: 30_000 });
  });

  test("clear selection resets the grid", async ({ page }) => {
    await page.goto("/lineups/new");
    await expect(
      page.getByRole("heading", { name: /Build Your Starting 5/i }),
    ).toBeVisible({ timeout: 15_000 });

    const tierRow = page.locator("div.flex.items-start").filter({
      has: page.getByRole("heading", { name: "$5", exact: true }),
    });
    await tierRow.locator('button[type="button"]').first().click();

    await expect(page.getByText("$10")).toBeVisible();
    await page.getByRole("button", { name: "Clear Selection" }).click();
    await expect(page.getByText("$15")).toBeVisible();
  });
});

test.describe("user search", () => {
  test("search for cassius returns at least one result", async ({ page }) => {
    await page.goto("/users/search");
    await expect(
      page.getByRole("heading", { name: "Find Users" }),
    ).toBeVisible();
    await expect(
      page.getByText("Start typing to search for users"),
    ).toBeVisible();

    const searchInput = page.getByPlaceholder("Search by name or username...");
    await searchInput.fill("cassius");

    const userLink = page.locator('a[href^="/profile/"]').first();
    await expect(userLink).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/cassius/i).first()).toBeVisible();
  });

  test("user result shows follower count", async ({ page }) => {
    await page.goto("/users/search");
    const searchInput = page.getByPlaceholder("Search by name or username...");
    await searchInput.pressSequentially("cassius", { delay: 50 });

    await expect(page.getByText(/followers/).first()).toBeVisible({
      timeout: 30_000,
    });
  });

  test("empty search shows prompt text", async ({ page }) => {
    await page.goto("/users/search");
    await expect(
      page.getByText("Start typing to search for users"),
    ).toBeVisible();
  });

  test("nonsense query shows no results message", async ({ page }) => {
    await page.goto("/users/search");
    const searchInput = page.getByPlaceholder("Search by name or username...");
    await searchInput.pressSequentially("zzzzxqnonexistent", { delay: 50 });
    await expect(page.getByText(/No users found for/i)).toBeVisible({
      timeout: 30_000,
    });
  });
});

test.describe("contact page", () => {
  test("loads with form fields for authenticated user", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByRole("heading", { name: /contact/i })).toBeVisible();
    await expect(page.locator("body")).not.toHaveText(/application error/i);
  });
});

test.describe("profile and settings", () => {
  test("settings page loads with heading", async ({ page }) => {
    await page.goto("/profile/settings");
    await expect(page).not.toHaveURL(/sign-in/);
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      page.getByText("Manage your account and preferences"),
    ).toBeVisible();
  });
});
