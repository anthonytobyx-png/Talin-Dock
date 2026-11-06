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
    await expect(
      page.getByRole("button", { name: "Bedroom", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("region", { name: "Scenes", exact: true }),
    ).toHaveCount(0);
    await page
      .getByRole("navigation")
      .getByRole("button", { name: "Settings", exact: true })
      .click();
    await page.getByLabel("Dehumidifier", { exact: true }).check();
    await page.getByLabel("Temperature", { exact: true }).uncheck();
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
    ).toHaveCount(0);
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
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Settings", exact: true })
    .click();
  await page.getByRole("button", { name: "Move Humidity earlier" }).click();
  await page.getByLabel("Humidity widget size").selectOption("wide");
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
  await expect(
    page.getByLabel("Return to Household after 10 minutes idle"),
  ).toBeChecked();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Home", exact: true })
    .click();
  // Settle the scroll caused by reaching a setting on a long page before
  // jumping time. A queued scroll is real activity to the idle tracker.
  await page.clock.runFor(1000);
  await page.clock.fastForward(590000);
  await expect(
    page.getByRole("button", { name: "Switch profile: Anthony", exact: true }),
  ).toBeVisible();
  await page.clock.fastForward(20000);
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
        page.getByRole("button", {
          name: "Open Samsung TV controls",
          exact: true,
        }),
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
  await expect(
    page.getByRole("button", { name: "Turn on", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText("Connection", { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Open Samsung TV controls" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Open Dehumidifier controls", exact: true })
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
    await expect(controls).toContainText("Timers unavailable");
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
  await expect(
    page.getByRole("button", { name: "Open Samsung TV controls" }),
  ).toContainText("Off");
  await page.getByRole("button", { name: "Open Samsung TV controls" }).click();
  expect(commands).toHaveLength(0);
  const panel = page.getByRole("region", {
    name: "Samsung TV power and timers",
  });
  await expect(panel).toContainText("Reported power: off");
  await panel.getByRole("button", { name: "Turn on", exact: true }).click();
  await expect(panel.getByRole("status")).toContainText(
    "request accepted by the hub",
  );
  await expect(panel).toContainText("Measurement time unavailable");
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
  expect(commands).toHaveLength(0);
  await page
    .getByRole("button", { name: "Open Dehumidifier controls", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Dehumidifier",
    exact: true,
  });
  await expect(
    page.getByText("Latest reported humidity · measurement time unavailable.", {
      exact: false,
    }),
  ).toBeVisible();
  const controls = page.getByRole("region", {
    name: "Dehumidifier power and timers",
  });
  await controls.getByRole("button", { name: "Turn on", exact: true }).click();
  await expect(dialog).toContainText("Reported power: On");
  expect(commands).toHaveLength(1);
  expect(commands[0]).toMatchObject({ action: "on" });
  await page.context().setOffline(true);
  await expect(dialog).toContainText("Offline. Previous readings are stale");
  await expect(
    controls.getByRole("button", { name: "Turn off", exact: true }),
  ).toBeDisabled();
  await expect(
    dialog.getByRole("button", {
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

test("Computer mode uses live reports, acknowledges bounded controls and disables them offline", async ({
  page,
  context,
}) => {
  let volume = 50;
  const commands: unknown[] = [];
  const id = "33333333-3333-4333-8333-333333333333";
  await page.route("**/api/computers", async (route) => {
    if (route.request().method() === "POST") {
      const data = route.request().postDataJSON();
      if (data.operation === "command") {
        commands.push(data.command);
        volume = data.command.value;
        await route.fulfill({
          status: 202,
          json: { id: data.id, status: "pending" },
        });
      } else
        await route.fulfill({
          json: { status: "acknowledged", watching: true },
        });
    } else
      await route.fulfill({
        json: {
          computers: [
            {
              id,
              name: "Fixture Windows PC",
              platform: "Windows",
              online: true,
              lastSeen: Date.now(),
              snapshot: {
                sampledAt: new Date().toISOString(),
                cpuPercent: 23,
                memoryUsedMb: 8192,
                memoryTotalMb: 32768,
                gpu: {
                  name: "Fixture GPU",
                  loadPercent: 12,
                  temperatureC: 40,
                  memoryUsedMb: 1024,
                  memoryTotalMb: 8192,
                },
                audio: {
                  volume,
                  muted: false,
                  output: "Fixture speakers",
                  microphoneMuted: null,
                  sessions: [],
                },
                capabilities: ["masterVolume", "masterMute"],
              },
            },
          ],
        },
      });
  });
  await page.goto("/");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Computer", exact: true })
    .click();
  await expect(page.getByText("CPU: 23%", { exact: false })).toBeVisible();
  const slider = page.getByRole("slider", {
    name: "Master volume",
    exact: true,
  });
  await slider.focus();
  await slider.press("ArrowRight");
  await page
    .getByRole("button", { name: "Apply master volume · 51%", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Companion acknowledged",
  );
  await expect(page.getByRole("status")).toContainText(
    /in \d+ ms through the cloud/,
  );
  expect(commands).toEqual([{ action: "masterVolume", value: 51 }]);
  await expect(
    page.getByRole("button", { name: "Play / pause", exact: true }),
  ).toBeDisabled();
  await context.setOffline(true);
  await expect(
    page.getByRole("button", { name: "Mute speakers", exact: true }),
  ).toBeDisabled();
  await expect(page.getByRole("alert")).toContainText("stale");
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain(
    "Fixture speakers",
  );
  await context.setOffline(false);
});

test("device dialogs preserve timer controls and reload saved timers without issuing actions on open", async ({
  page,
}) => {
  const actions: Record<string, unknown>[] = [];
  let countdownLeft = 0;
  let timer: {
    id: string;
    deviceId: string;
    action: string;
    dueAt: string;
    status: string;
  } | null = null;
  await page.route("**/api/tuya**", async (route) => {
    if (route.request().method() === "POST") {
      const data = route.request().postDataJSON();
      actions.push(data);
      countdownLeft = data.action === "2h" ? 120 : 0;
      await route.fulfill({ json: { acknowledged: true } });
    } else
      await route.fulfill({
        json: {
          available: true,
          connected: true,
          timerReady: true,
          state: {
            online: true,
            power: true,
            humidity: 61,
            observedAt: new Date().toISOString(),
            measurementTime: null,
            canPower: true,
            countdownOptions: ["cancel", "2h"],
            countdownLeft,
            countdownSetting: countdownLeft ? "2h" : "cancel",
          },
        },
      });
  });
  await page.route("**/api/power-timers", async (route) => {
    if (route.request().method() === "POST") {
      const data = route.request().postDataJSON();
      actions.push(data);
      timer =
        data.operation === "create"
          ? {
              id: data.id,
              deviceId: data.deviceId,
              action: data.action,
              dueAt: new Date(Date.now() + data.seconds * 1000).toISOString(),
              status: "pending",
            }
          : null;
    }
    await route.fulfill({ json: { timer, timers: timer ? [timer] : [] } });
  });
  await page.goto("/");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Devices", exact: true })
    .click();
  const tile = page.getByRole("button", {
    name: "Open Dehumidifier controls",
    exact: true,
  });
  await expect(tile).toContainText("On");
  await tile.click();
  const dialog = page.getByRole("dialog", {
    name: "Dehumidifier",
    exact: true,
  });
  await expect(dialog).toContainText("61%");
  expect(actions).toEqual([]);
  await dialog
    .getByRole("button", { name: "Set device 2-hour countdown", exact: true })
    .click();
  await expect(dialog).toContainText("120 minutes remaining");
  await dialog
    .getByRole("button", { name: "Cancel device countdown", exact: true })
    .click();
  await expect(dialog).toContainText("0 minutes remaining");
  await dialog.getByRole("button", { name: "Add timer", exact: true }).click();
  await expect(
    dialog.getByRole("button", { name: "Cancel timer", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(tile).toBeFocused();
  await tile.click();
  await expect(
    dialog.getByRole("button", { name: "Cancel timer", exact: true }),
  ).toBeVisible();
  expect(actions).toHaveLength(3);
  await dialog
    .getByRole("button", { name: "Cancel timer", exact: true })
    .click();
  await expect(
    dialog.getByRole("button", { name: "Cancel timer", exact: true }),
  ).toHaveCount(0);
  expect(actions.map((a) => a.action || a.operation)).toEqual([
    "2h",
    "cancel",
    "off",
    "cancel",
  ]);
  expect(actions[2]).toMatchObject({
    operation: "create",
    seconds: 1800,
    action: "off",
  });
});

test("one Home space preserves old preferences and keeps configuration only in Settings", async ({
  page,
}) => {
  await page.goto("/");
  const legacy = await page.evaluate(() => {
    const key = "talin-dock.preferences.v1";
    const value = JSON.parse(localStorage.getItem(key)!);
    value.room = "Bedroom";
    value.household.layouts.Bedroom = ["dehumidifier", "quick"];
    localStorage.setItem(key, JSON.stringify(value));
    return value;
  });
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Bedroom", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText("Good morning", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Movie time", { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Edit widgets", exact: true }),
  ).toHaveCount(0);
  for (const section of ["Devices", "Calendars", "Display"]) {
    await page
      .getByRole("navigation")
      .getByRole("button", { name: section, exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Calendar providers", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByLabel("TV hub HTTPS address", { exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Dashboard layout", exact: true }),
    ).toHaveCount(0);
  }
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Devices", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Open Dehumidifier controls", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Dehumidifier",
    exact: true,
  });
  await expect(dialog.getByRole("textbox")).toHaveCount(0);
  await expect(
    dialog.getByRole("button", { name: "Connect Smart Life", exact: true }),
  ).toHaveCount(0);
  await page.keyboard.press("Escape");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Settings", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Calendar providers", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Dashboard layout", exact: true }),
  ).toBeVisible();
  await page.getByText("Advanced TV hub address", { exact: true }).click();
  await expect(
    page.getByLabel("TV hub HTTPS address", { exact: true }),
  ).toBeVisible();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("talin-dock.preferences.v1")!),
  );
  expect(saved.household).toEqual(legacy.household);
  expect(saved.room).toBe("Bedroom");
});
