import { test, expect, type APIRequestContext } from "@playwright/test";
import { defaults } from "../../src/state/model";
const origin = "http://127.0.0.1:8790";
const headers = { Origin: origin, "X-Talin-Request": "1" };
async function login(request: APIRequestContext) {
  const response = await request.post("/api/login", {
    headers,
    data: { password: "local-test-passphrase-only" },
  });
  expect(response.status()).toBe(200);
  return response;
}
test("private preferences require authentication and same-origin writes", async ({
  request,
}) => {
  const session = await request.get("/api/session");
  expect(await session.json()).toEqual({
    configured: true,
    authenticated: false,
  });
  expect((await request.get("/api/preferences")).status()).toBe(401);
  expect((await request.get("/api/device-actions")).status()).toBe(401);
  expect(
    (await request.post("/api/device-actions", { data: {} })).status(),
  ).toBe(403);
  expect(
    (await request.put("/api/preferences", { data: defaults() })).status(),
  ).toBe(403);
  expect(
    (
      await request.post("/api/login", {
        headers: { ...headers, Origin: "https://evil.example" },
        data: { password: "local-test-passphrase-only" },
      })
    ).status(),
  ).toBe(403);
});
test("D1 persists preferences, rejects stale revisions and revokes sessions", async ({
  request,
}) => {
  const response = await login(request);
  const cookie = response.headers()["set-cookie"];
  expect(cookie).toContain("HttpOnly");
  expect(cookie).toContain("Secure");
  expect(cookie).toContain("SameSite=Strict");
  const read = await request.get("/api/preferences");
  const actions = await request.get("/api/device-actions");
  expect(actions.headers()["cache-control"]).toBe("no-store");
  expect(await actions.json()).toEqual({ devices: {} });
  expect(
    (
      await request.post("/api/device-actions", {
        headers,
        data: {
          deviceId: "tuya-dehumidifier",
          action: "on",
          requestId: "00000000-0000-4000-8000-000000000001",
        },
      })
    ).status(),
  ).toBe(503);
  expect(
    (
      await request.post("/api/device-actions", {
        headers,
        data: {
          deviceId: "tuya-dehumidifier",
          action: "on",
          requestId: "00000000-0000-4000-8000-000000000001",
          url: "https://evil.example",
        },
      })
    ).status(),
  ).toBe(400);
  expect(read.headers()["cache-control"]).toBe("no-store");
  const snapshot = await read.json();
  const state = defaults();
  state.profiles.anthony.name = "Cloud Anthony";
  const write = await request.put("/api/preferences", {
    headers: { ...headers, "If-Match": `"${snapshot.revision}"` },
    data: state,
  });
  expect(write.status()).toBe(200);
  const stored = await request.get("/api/preferences");
  expect((await stored.json()).state.profiles.anthony.name).toBe(
    "Cloud Anthony",
  );
  expect(
    (
      await request.put("/api/preferences", {
        headers: { ...headers, "If-Match": `"${snapshot.revision}"` },
        data: state,
      })
    ).status(),
  ).toBe(409);
  expect(
    (
      await request.put("/api/preferences", {
        headers: { ...headers, "If-Match": `"${snapshot.revision + 1}"` },
        data: { ...state, token: "should-never-be-stored" },
      })
    ).status(),
  ).toBe(400);
  expect(
    (await request.put("/api/preferences", { headers, data: state })).status(),
  ).toBe(428);
  expect(
    (
      await request.put("/api/preferences", {
        headers: { ...headers, "If-Match": '"1"' },
        data: { ...state, oversized: "x".repeat(40000) },
      })
    ).status(),
  ).toBe(400);
  const logout = await request.post("/api/logout", { headers, data: {} });
  expect(logout.status()).toBe(200);
  expect((await request.get("/api/preferences")).status()).toBe(401);
  expect(
    (
      await request.get("/api/preferences", {
        headers: { Cookie: cookie.split(";")[0] },
      })
    ).status(),
  ).toBe(401);
});
test("offline shell reloads, keeps local settings, and never caches APIs", async ({
  page,
  context,
}) => {
  await page.route("https://api.open-meteo.com/**", (route) => route.abort());
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Calendar", exact: true }),
  ).toBeVisible();
  await page.evaluate(() =>
    navigator.serviceWorker.ready.then(() => undefined),
  );
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await page.reload();
  await page.getByRole("button", { name: "Bedroom", exact: true }).click();
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByText("You’re offline.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText("Reloading offline is not supported yet.", { exact: false }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Bedroom", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("heading", { name: "Dehumidifier", exact: true }),
  ).toBeVisible();
  const cached = await page.evaluate(async () => {
    const result: string[] = [];
    for (const name of await caches.keys()) {
      const cache = await caches.open(name);
      result.push(
        ...(await cache.keys()).map((request) => new URL(request.url).pathname),
      );
    }
    return result;
  });
  expect(cached.length).toBeGreaterThan(3);
  expect(cached.some((path) => path.startsWith("/api/"))).toBe(false);
  await context.setOffline(false);
});
test("browser signs in and saves preferences through the actual API", async ({
  page,
}) => {
  await page.route("https://api.open-meteo.com/**", (route) => route.abort());
  await page.goto("/");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Settings", exact: true })
    .click();
  await expect(page.getByLabel("Household passphrase")).toBeVisible();
  await page
    .getByLabel("Household passphrase")
    .fill("local-test-passphrase-only");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Read cloud copy" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Read cloud copy" }).click();
  await page
    .getByLabel(
      "I understand this will replace the selected destination’s preferences",
    )
    .check();
  await page.getByRole("button", { name: "Save this device to cloud" }).click();
  await expect(page.getByText(/Saved cloud revision/)).toBeVisible();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page.getByLabel("Household passphrase")).toBeVisible();
  const stored = await page.evaluate(() => JSON.stringify(localStorage));
  expect(stored).not.toContain("local-test-passphrase-only");
  expect(stored).not.toContain("__Host-talin-session");
});
test("login attempts are durably rate limited", async ({ request }) => {
  let response = await request.post("/api/login", {
    headers,
    data: { password: "wrong-password-for-test" },
  });
  expect(response.status()).toBe(401);
  for (let index = 0; index < 5; index++)
    response = await request.post("/api/login", {
      headers,
      data: { password: "wrong-password-for-test" },
    });
  expect(response.status()).toBe(429);
  expect(response.headers()["retry-after"]).toBe("900");
});
