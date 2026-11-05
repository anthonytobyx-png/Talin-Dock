import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await page.route("https://192.168.1.3:*/**", (route) => route.abort());
  await page.route("https://api.open-meteo.com/**", (route) =>
    route.fulfill({
      json: {
        current: { temperature_2m: 11, weather_code: 3 },
        daily: {
          time: [
            "2026-11-04",
            "2026-11-05",
            "2026-11-06",
            "2026-11-07",
            "2026-11-08",
          ],
          temperature_2m_max: [12, 13, 14, 12, 11],
          temperature_2m_min: [5, 6, 4, 3, 5],
        },
      },
    }),
  );
});
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
      page.getByRole("button", { name: "Turn on", exact: true }),
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

test("widget order, size and backup restore survive a reload", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Edit widgets" }).click();
  await page.getByRole("button", { name: "Move Humidity earlier" }).click();
  await page.getByLabel("Humidity widget size").selectOption("wide");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.reload();
  const state = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("talin-dock.preferences.v1")!),
  );
  expect(state.household.layouts.Desk[1]).toBe("humidity");
  expect(state.household.sizes.Desk.humidity).toBe("wide");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Settings", exact: true })
    .click();
  const backup = structuredClone(state);
  backup.profiles.anthony.name = "Restored Anthony";
  await page.getByLabel("Import preferences backup").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await expect(
    page.getByRole("button", { name: "Replace local preferences" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Replace local preferences" }).click();
  await page
    .getByRole("button", { name: "Switch profile: Household", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Use Restored Anthony profile" }),
  ).toBeVisible();
});
test("weather location search updates the real-provider request and persists", async ({
  page,
}) => {
  await page.route("https://geocoding-api.open-meteo.com/**", (route) =>
    route.fulfill({
      json: {
        results: [
          {
            name: "Dublin",
            country: "Ireland",
            latitude: 53.35,
            longitude: -6.26,
          },
        ],
      },
    }),
  );
  await page.goto("/");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Settings", exact: true })
    .click();
  await page.getByLabel("Town or city").fill("Dublin");
  await page.getByRole("button", { name: "Search locations" }).click();
  await page
    .getByRole("button", { name: "Dublin, Ireland", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByText("Current location: Dublin, Ireland"),
  ).toBeVisible();
});
test("idle return switches personal profile back to Household", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  await page
    .getByRole("button", { name: "Switch profile: Household", exact: true })
    .click();
  await page.getByRole("button", { name: "Use Anthony profile" }).click();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Settings", exact: true })
    .click();
  await page.getByLabel("Return to Household after 10 minutes idle").check();
  await page.clock.fastForward(601000);
  await expect(
    page.getByRole("button", {
      name: "Switch profile: Household",
      exact: true,
    }),
  ).toBeVisible();
});

test.describe("short tablet navigation", () => {
  test.use({ hasTouch: true });
  for (const size of [
    { width: 1024, height: 600 },
    { width: 768, height: 700 },
  ]) {
    test(`Settings stays reachable above the profile footer at ${size.width}x${size.height}`, async ({
      page,
    }) => {
      await page.setViewportSize(size);
      await page.goto("/");
      const navigation = page.getByRole("navigation");
      await navigation
        .getByRole("button", { name: "Settings", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: "Settings", exact: true }),
      ).toBeVisible();
      await navigation
        .getByRole("button", { name: "Home", exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: "Edit widgets", exact: true }),
      ).toBeVisible();
      const target = await navigation
        .getByRole("button", { name: "Home", exact: true })
        .boundingBox();
      expect(target!.height).toBeGreaterThanOrEqual(44);
      expect(target!.width).toBeGreaterThanOrEqual(44);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page
        .getByRole("button", { name: "Open profiles", exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: "Use Anthony profile" }),
      ).toBeVisible();
    });
  }
});

test("unconnected devices expose power and timers without enabling unverified commands", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Devices", exact: true })
    .click();
  for (const name of ["Dehumidifier"]) {
    const controls = page.getByRole("region", {
      name: `${name} power and timers`,
    });
    await expect(
      controls.getByRole("button", { name: "Turn on", exact: true }),
    ).toBeDisabled();
    await expect(
      controls.getByRole("button", { name: "Turn off", exact: true }),
    ).toBeDisabled();
    await expect(
      controls.getByRole("button", { name: "Add timer", exact: true }),
    ).toBeDisabled();
    await expect(controls.getByLabel("Countdown (minutes)")).toBeDisabled();
    await expect(controls).toContainText(
      "Keeping this page open is not a reliable timer",
    );
  }
});

test("TV local controls distinguish hub acknowledgement, reported power and stale connections", async ({
  page,
  context,
}) => {
  const commands: unknown[] = [];
  await page.route("https://192.168.1.3:*/**", async (route) => {
    if (route.request().method() === "POST") {
      commands.push(route.request().postDataJSON());
      await route.fulfill({ json: { accepted: true, deviceConfirmed: false } });
    } else
      await route.fulfill({
        json: {
          version: 1,
          reportedPower: "off",
          reportedAt: 1793880000,
          timers: {},
        },
      });
  });
  await page.goto("/");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Devices", exact: true })
    .click();
  const panel = page.getByRole("region", {
    name: "Samsung TV power and timers",
  });
  await expect(panel).toContainText("Secure TV hub reachable");
  await panel.getByRole("button", { name: "Turn on", exact: true }).click();
  await expect(panel.getByRole("status")).toContainText(
    "request accepted by the hub",
  );
  await expect(panel).toContainText("underlying TV sample time is unavailable");
  expect(commands).toHaveLength(1);
  expect(commands[0]).toMatchObject({ action: "on" });
  await context.setOffline(true);
  await expect(
    panel.getByRole("button", { name: "Turn off", exact: true }),
  ).toBeDisabled();
  await expect(
    panel.getByRole("button", { name: "Add TV timer", exact: true }),
  ).toBeDisabled();
  await expect(panel.getByRole("alert")).toContainText("stale");
  expect(commands).toHaveLength(1);
  await context.setOffline(false);
});

test("Smart Life connects inside Talin, labels unknown sample age, and keeps credentials out of local storage", async ({
  page,
}) => {
  let connected = false,
    power = false;
  const state = () => ({
    online: true,
    power,
    humidity: 63,
    observedAt: new Date().toISOString(),
    measurementTime: null,
    canPower: true,
    countdownOptions: ["cancel", "2h"],
    countdownSetting: "cancel",
    countdownLeft: 0,
  });
  const commands: unknown[] = [];
  await page.route("**/api/tuya**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/connect")) {
      await route.fulfill({
        json: {
          connectionId: "a".repeat(64),
          qrData: "tuyaSmart--qrLogin?token=fixture-only",
        },
      });
      return;
    }
    if (path.endsWith("/poll")) {
      connected = true;
      await route.fulfill({ json: { connected: true, state: state() } });
      return;
    }
    if (path.endsWith("/action")) {
      const data = route.request().postDataJSON();
      commands.push(data);
      power = data.action === "on";
      await route.fulfill({ json: { acknowledged: true } });
      return;
    }
    await route.fulfill({
      json: {
        available: true,
        connected,
        state: connected ? state() : undefined,
        timerReady: false,
      },
    });
  });
  await page.goto("/");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Settings", exact: true })
    .click();
  const section = page.getByRole("region", {
    name: "Smart Life connection",
    exact: true,
  });
  await section
    .getByRole("button", { name: "Connect Smart Life", exact: true })
    .click();
  await section
    .getByLabel("Smart Life User Code", { exact: true })
    .fill("private-fixture-code");
  await section
    .getByRole("button", {
      name: "Generate Smart Life consent QR",
      exact: true,
    })
    .click();
  await expect(section.getByRole("img")).toBeVisible();
  await section
    .getByRole("button", {
      name: "I approved in Smart Life — check connection",
      exact: true,
    })
    .click();
  await expect(section).toContainText("Power reported by Smart Life: Off");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Devices", exact: true })
    .click();
  await expect(
    section.getByRole("button", { name: "Reconnect Smart Life", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Latest reported humidity · measurement time unavailable.", {
      exact: false,
    }),
  ).toBeVisible();
  const controls = page.getByRole("region", {
    name: "Dehumidifier power and timers",
  });
  await controls.getByRole("button", { name: "Turn on", exact: true }).click();
  await expect(section).toContainText("Power reported by Smart Life: On");
  expect(commands).toHaveLength(1);
  expect(commands[0]).toMatchObject({ action: "on" });
  await page.context().setOffline(true);
  await expect(section).toContainText(
    "Offline. Previous Smart Life readings are stale",
  );
  await expect(
    controls.getByRole("button", { name: "Turn off", exact: true }),
  ).toBeDisabled();
  await expect(
    section.getByRole("button", {
      name: "Set device 2-hour countdown",
      exact: true,
    }),
  ).toBeDisabled();
  await expect(page.getByText("Stale reading", { exact: false })).toBeVisible();
  expect(commands).toHaveLength(1);
  await page.context().setOffline(false);
  await expect(
    controls.getByRole("button", { name: "Turn off", exact: true }),
  ).toBeEnabled();

  await expect(
    controls.getByRole("button", { name: "Add timer", exact: true }),
  ).toBeDisabled();
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain(
    "private-fixture-code",
  );
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain(
    "fixture-only",
  );
  expect(page.context().pages()).toHaveLength(1);
});
