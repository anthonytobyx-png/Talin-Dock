import { test, expect } from "@playwright/test";

test("appearance choices persist without device writes and respect reduced motion", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const writes: string[] = [];
  await page.route("**/api/**", async (route) => {
    if (route.request().method() !== "GET") writes.push(route.request().url());
    await route.fulfill({ status: 401, json: { error: "Sign-in required" } });
  });
  // Appearance checks must never contact any external service or appliance.
  await page.route(/^https:\/\//, async (route) => {
    if (route.request().method() !== "GET") writes.push(route.request().url());
    await route.abort();
  });
  await page.goto("/");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Settings", exact: true })
    .click();
  const appearance = page.locator(".appearance-settings");
  await expect(appearance.getByRole("button")).toHaveCount(6);
  await appearance
    .getByRole("button", { name: "Aurora theme", exact: true })
    .click();
  await expect(page.locator(".app")).toHaveClass(/theme-aurora/);
  await expect(page.getByTestId("pixel-visitor")).toBeVisible();
  expect(
    await page
      .locator(".companion-wander")
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
  expect(
    await page
      .locator(".page-surface")
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
  await page.screenshot({ path: "test-results/appearance-settings.png" });
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Home", exact: true })
    .click();
  await page.screenshot({ path: "test-results/appearance-home.png" });
  const before = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("talin-dock.preferences.v1")!),
  );
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Settings", exact: true })
    .click();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await appearance
    .getByRole("checkbox", { name: "Gentle motion & glow" })
    .uncheck();
  expect(
    await page
      .locator(".companion-wander")
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
  await appearance.getByRole("checkbox", { name: "Pixel visitor" }).uncheck();
  await expect(page.getByTestId("pixel-visitor")).toHaveCount(0);
  await page.reload();
  await expect(page.locator(".app")).toHaveClass(/theme-aurora/);
  await expect(page.locator(".app")).toHaveClass(/effects-off/);
  await expect(
    appearance.getByRole("checkbox", { name: "Pixel visitor" }),
  ).not.toBeChecked();
  const after = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("talin-dock.preferences.v1")!),
  );
  expect(after.household).toEqual(before.household);
  expect(after.profiles.anthony).toEqual(before.profiles.anthony);
  expect(after.profiles.barbara).toEqual(before.profiles.barbara);
  expect(writes).toEqual([]);
});
