/// <reference types="@cloudflare/workers-types" />
import { afterEach, expect, it, vi } from "vitest";
import { database } from "./database";
import { runTimers, runnerReady } from "../../server/timers";
import { handleTimerApi } from "../../server/timerApi";
import { handleApi } from "../../server/api";
import { sha256 } from "../../server/auth";
const trigger = "00000000-0000-4000-8000-000000000001";
const token = "00000000-0000-4000-8000-000000000002";
const secret = JSON.stringify({
  "tuya-dehumidifier": {
    on: { trigger, token, verified: true },
    off: { trigger, token, verified: true },
  },
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
it("creates, lists and cancels a durable countdown with a matching live runner", async () => {
  const { sql, db } = database();
  const env = { DB: db, TALIN_ALEXA_TRIGGERS: secret };
  const now = Date.now();
  sql
    .prepare("INSERT INTO timer_runner VALUES(1,?,?)")
    .run(now, await sha256(secret));
  const input = {
    operation: "create",
    id: token,
    deviceId: "tuya-dehumidifier",
    action: "off",
    seconds: 120,
  };
  const request = new Request("https://talin.example/api/power-timers", {
    method: "POST",
  });
  const response = await handleTimerApi(request, env, async () => input);
  expect(response.status).toBe(201);
  expect((await response.json()).timer.status).toBe("pending");
  expect((await handleTimerApi(request, env, async () => input)).status).toBe(
    200,
  );
  expect(sql.prepare("SELECT COUNT(*) AS n FROM power_timers").get()?.n).toBe(
    1,
  );
  expect(
    (
      await handleTimerApi(request, env, async () => ({
        operation: "cancel",
        id: token,
      }))
    ).status,
  ).toBe(200);
  expect(sql.prepare("SELECT status FROM power_timers").get()?.status).toBe(
    "cancelled",
  );
  expect(
    (
      await handleTimerApi(request, env, async () => ({
        operation: "cancel",
        id: token,
      }))
    ).status,
  ).toBe(409);
  sql.close();
});
it("blocks schedules for stale/mismatched runners and unverified actions", async () => {
  const { sql, db } = database();
  sql
    .prepare("INSERT INTO timer_runner VALUES(1,?,?)")
    .run(Date.now() - 180001, await sha256(secret));
  expect(await runnerReady(db, secret)).toBe(false);
  sql.prepare("UPDATE timer_runner SET last_seen = ?").run(Date.now());
  expect(await runnerReady(db, "different configuration")).toBe(false);
  const response = await handleTimerApi(
    new Request("https://talin.example", { method: "POST" }),
    { DB: db },
    async () => ({
      operation: "create",
      id: token,
      deviceId: "tuya-dehumidifier",
      action: "off",
      seconds: 120,
    }),
  );
  expect(response.status).toBe(503);
  sql.close();
});
it("dispatches each due timer at most once and expires missed timers", async () => {
  const { sql, db } = database();
  const now = Date.now();
  const insert = sql.prepare(
    "INSERT INTO power_timers(id,device_id,action,due_at,created_at) VALUES(?,'tuya-dehumidifier','off',?,?)",
  );
  insert.run(token, now - 1000, now - 121000);
  insert.run(trigger, now - 121000, now - 300000);
  const request = vi.fn().mockResolvedValue(
    Response.json({
      URLRoutineTrigger: {
        triggerId: trigger,
        triggerActivationStatus: "success",
      },
    }),
  );
  vi.stubGlobal("fetch", request);
  const env = { DB: db, TALIN_ALEXA_TRIGGERS: secret };
  await runTimers(env, now);
  await runTimers(env, now);
  expect(request).toHaveBeenCalledOnce();
  expect(
    sql.prepare("SELECT status FROM power_timers WHERE id = ?").get(token)
      ?.status,
  ).toBe("acknowledged");
  expect(
    sql.prepare("SELECT status FROM power_timers WHERE id = ?").get(trigger)
      ?.status,
  ).toBe("expired");
  expect(await runnerReady(db, secret, now)).toBe(true);
  sql.close();
});
it("does not resend a timer after a lost acknowledgement", async () => {
  const { sql, db } = database();
  const now = Date.now();
  sql
    .prepare(
      "INSERT INTO power_timers VALUES(?,'tuya-dehumidifier','on',?,?,'pending')",
    )
    .run(token, now - 1000, now - 121000);
  const request = vi
    .fn()
    .mockRejectedValue(new Error("test-only transport failure"));
  vi.stubGlobal("fetch", request);
  const env = { DB: db, TALIN_ALEXA_TRIGGERS: secret };
  await runTimers(env, now);
  await runTimers(env, now);
  expect(request).toHaveBeenCalledOnce();
  expect(sql.prepare("SELECT status FROM power_timers").get()?.status).toBe(
    "unknown",
  );
  sql.close();
});
it("reserves a command before dispatch and does not repeat it on replay", async () => {
  const { sql, db } = database();
  const session = "a".repeat(64);
  sql
    .prepare("INSERT INTO sessions VALUES(?,?)")
    .run(await sha256(session), Date.now() + 60000);
  const request = vi.fn().mockResolvedValue(
    Response.json({
      URLRoutineTrigger: {
        triggerId: trigger,
        triggerActivationStatus: "success",
      },
    }),
  );
  vi.stubGlobal("fetch", request);
  const env = {
    DB: db,
    TALIN_PASSWORD_HASH: `pbkdf2:100000:${"0".repeat(32)}:${"0".repeat(64)}`,
    TALIN_ALEXA_TRIGGERS: secret,
  };
  const command = () =>
    new Request("https://talin.example/api/device-actions", {
      method: "POST",
      headers: {
        Origin: "https://talin.example",
        "X-Talin-Request": "1",
        "Content-Type": "application/json",
        Cookie: `__Host-talin-session=${session}`,
      },
      body: JSON.stringify({
        deviceId: "tuya-dehumidifier",
        action: "on",
        requestId: token,
      }),
    });
  expect((await (await handleApi(command(), env)).json()).acknowledged).toBe(
    true,
  );
  expect((await (await handleApi(command(), env)).json()).replay).toBe(true);
  expect(request).toHaveBeenCalledOnce();
  sql.close();
});

it("accepts only fresh signed scheduler requests and never household sessions alone", async () => {
  const { timerDispatchHeaders } = await import("../../server/timerDispatch");
  const { sql, db } = database();
  const token = "e".repeat(64);
  const env = {
    DB: db,
    TALIN_TIMER_TOKEN: token,
    TALIN_ALEXA_TRIGGERS: secret,
  };
  const url = "https://talin.example/api/timer-runner";
  for (const headers of [
    {},
    await timerDispatchHeaders("f".repeat(64)),
    await timerDispatchHeaders(token, Date.now() - 120000),
  ]) {
    expect(
      (await handleApi(new Request(url, { method: "POST", headers }), env))
        .status,
    ).toBe(404);
  }
  expect(sql.prepare("SELECT COUNT(*) AS n FROM timer_runner").get()?.n).toBe(
    0,
  );
  const headers = await timerDispatchHeaders(token);
  expect(
    (await handleApi(new Request(url, { method: "GET", headers }), env)).status,
  ).toBe(404);
  const accepted = await handleApi(
    new Request(url, { method: "POST", headers }),
    env,
  );
  expect(accepted.status).toBe(200);
  expect(accepted.headers.get("Cache-Control")).toBe("no-store");
  expect(sql.prepare("SELECT COUNT(*) AS n FROM timer_runner").get()?.n).toBe(
    1,
  );
  sql.close();
});
