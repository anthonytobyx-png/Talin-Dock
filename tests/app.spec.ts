import { test, expect } from "@playwright/test";
for (const size of [
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
]) {
  test(`dashboard, persistence and navigation at ${size.width}x${size.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(size);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Calendar", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Bedroom", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Dehumidifier", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Edit widgets" }).click();
    await page.getByLabel("Temperature", { exact: true }).uncheck();
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await page
      .getByRole("button", { name: "Switch profile: Household", exact: true })
      .click();
    await page.getByRole("button", { name: "Use Bárbara profile" }).click();
    await page
      .getByRole("navigation")
      .getByRole("button", { name: "Settings", exact: true })
      .click();
    await page.getByLabel("Display name").fill("Bia");
    await page.getByLabel("24-hour clock").uncheck();
    await page.reload();
    await expect(page.getByLabel("Display name")).toHaveValue("Bia");
    await expect(page.getByLabel("24-hour clock")).not.toBeChecked();
    for (const section of [
      "Devices",
      "Remote",
      "Calendars",
      "Media",
      "Voice",
      "Computer",
      "Display",
      "Settings",
      "Home",
    ]) {
      await page
        .getByRole("navigation")
        .getByRole("button", { name: section, exact: true })
        .click();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
    }
    await expect(
      page.getByRole("button", { name: "Bedroom", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByRole("heading", { name: "Temperature", exact: true }),
    ).toHaveCount(0);
    await page.screenshot({
      path: `test-results/home-${size.width}.png`,
      fullPage: true,
    });
    await page
      .getByRole("navigation")
      .getByRole("button", { name: "Remote", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Power", exact: true }),
    ).toBeDisabled();
    expect(errors).toEqual([]);
  });
}
test("profile dialog keyboard dismissal restores focus", async ({ page }) => {
  await page.goto("/");
  const chip = page.getByRole("button", {
    name: "Switch profile: Household",
    exact: true,
  });
  await chip.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(chip).toBeFocused();
});
