import { afterEach, expect, it, vi } from "vitest";
import { createHash, createHmac, createCipheriv } from "node:crypto";
import { database } from "./database";
import {
  md5,
  decryptResponse,
  signedRequest,
  validEndpoint,
  type TuyaCredentials,
} from "../../server/tuya/protocol";
import { seal, unseal } from "../../server/tuya/storage";
import { snapshot } from "../../server/tuya/service";
import { handleApi } from "../../server/api";
import { sha256 } from "../../server/auth";
import { timerConfiguration } from "../../server/timers";
const key = "f".repeat(64),
  session = "a".repeat(64),
  now = 1793839632000;
const credentials: TuyaCredentials = {
  userCode: "user-code-fixture",
  endpoint: "https://apigw.tuyaeu.com",
  terminalId: "terminal-fixture",
  deviceId: "device-fixture",
  token: {
    t: now,
    expire_time: 7200,
    uid: "uid-fixture",
    access_token: "access-fixture",
    refresh_token: "refresh-fixture",
  },
};
const spec = {
  functions: [
    { code: "switch", type: "Boolean", values: "{}" },
    {
      code: "countdown_set",
      type: "Enum",
      values: JSON.stringify({ range: ["cancel", "2h"] }),
    },
  ],
  status: [
    {
      code: "humidity_indoor",
      type: "Integer",
      values: JSON.stringify({ unit: "%", scale: 0, min: 0, max: 100 }),
    },
  ],
};
const detail = (power = false) => ({
  id: "device-fixture",
  category: "cs",
  product_name: "DEV_19",
  online: true,
  update_time: 1,
  status: [
    { code: "switch", value: power },
    { code: "humidity_indoor", value: 63 },
    { code: "countdown_set", value: "cancel" },
    { code: "countdown_left", value: 0 },
  ],
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
it("does not require unused Alexa credentials in the direct Tuya timer worker", () => {
  expect(
    timerConfiguration({
      TALIN_TUYA_KEY: key,
      TALIN_ALEXA_TRIGGERS: JSON.stringify({
        "samsung-tv": { on: { verified: false } },
      }),
    }),
  ).toBe(timerConfiguration({ TALIN_TUYA_KEY: key }));
});
it("matches standard MD5 vectors and the official Tuya SDK encryption/signature fixture", async () => {
  expect(md5("")).toBe("d41d8cd98f00b204e9800998ecf8427e");
  expect(md5("abc")).toBe("900150983cd24fb0d6963f7d28e17f72");
  expect(md5("a".repeat(1000))).toBe(
    createHash("md5").update("a".repeat(1000)).digest("hex"),
  );
  const encrypted =
    "QUJDREVGR0hKS01O/ftnJOR40vEytbAAvgUZp7W36Xu9Rvqon7dqsdtxNgMXI1532IWL5+yQix8ieoDcjDmw74EjYLtw77IY1w==";
  expect(await decryptResponse(encrypted, "26849781863346f1")).toEqual({
    commands: [{ code: "switch", value: true }],
  });
  vi.useFakeTimers();
  vi.setSystemTime(now);
  vi.spyOn(crypto, "randomUUID").mockReturnValue(
    "00000000-0000-4000-8000-000000000001",
  );
  vi.spyOn(crypto, "getRandomValues").mockImplementation((array) => {
    new Uint8Array(array!.buffer, array!.byteOffset, array!.byteLength).set(
      Array.from({ length: 12 }, (_, i) => i),
    );
    return array;
  });
  const request = vi
    .fn()
    .mockResolvedValue(Response.json({ success: true, result: true, t: now }));
  await signedRequest(
    credentials,
    "POST",
    "/v1.1/m/thing/device-fixture/commands",
    undefined,
    { commands: [{ code: "switch", value: true }] },
    request,
  );
  const [, options] = request.mock.calls[0];
  expect(JSON.parse(options.body).encdata).toBe(encrypted);
  expect(options.headers["X-sign"]).toBe(
    "a1ffc7629a2681aa13bce759db2665300ca436e55fb912ad99882d9d66163108",
  );
});
it("encrypts stored credentials and rejects altered ciphertext or keys", async () => {
  const encrypted = await seal(credentials, key);
  expect(encrypted).not.toContain("access-fixture");
  expect(await unseal(encrypted, key)).toEqual(credentials);
  await expect(unseal(encrypted, "e".repeat(64))).rejects.toThrow();
  await expect(unseal(encrypted.slice(0, -4) + "AAAA", key)).rejects.toThrow();
});
it("never treats metadata update time as a humidity sample timestamp or accepts wrong units", () => {
  const state = snapshot(detail(), spec, now);
  expect(state.humidity).toBe(63);
  expect(state.measurementTime).toBeNull();
  expect(state.observedAt).toBe(new Date(now).toISOString());
  expect(state.countdownOptions).toEqual(["cancel", "2h"]);
  expect(
    snapshot(
      detail(),
      {
        ...spec,
        status: [
          {
            code: "humidity_indoor",
            type: "Integer",
            values: JSON.stringify({ unit: "F", scale: 0 }),
          },
        ],
      },
      now,
    ).humidity,
  ).toBeNull();
  expect(() =>
    snapshot({ ...detail(), product_name: "unrelated-device" }, spec, now),
  ).toThrow();
  expect(validEndpoint("https://127.0.0.1")).toBe(false);
  expect(validEndpoint("http://apigw.tuyaeu.com")).toBe(false);
  expect(validEndpoint("https://apigw.tuyaeu.com.evil.example")).toBe(false);
});
async function setup() {
  const { sql, db } = database();
  sql
    .prepare("INSERT INTO sessions VALUES(?,?)")
    .run(await sha256(session), Date.now() + 3600000);
  const env = {
    DB: db,
    TALIN_PASSWORD_HASH: `pbkdf2:100000:${"0".repeat(32)}:${"0".repeat(64)}`,
    TALIN_TUYA_KEY: key,
  };
  const request = (path: string, data?: unknown, cookie = session) =>
    handleApi(
      new Request("https://talin.example/api/tuya" + path, {
        method: data ? "POST" : "GET",
        headers: {
          Origin: "https://talin.example",
          "X-Talin-Request": "1",
          "Content-Type": "application/json",
          Cookie: `__Host-talin-session=${cookie}`,
        },
        body: data ? JSON.stringify(data) : undefined,
      }),
      env,
    );
  return { sql, db, env, request };
}
function mockProvider() {
  const state = { power: false, commands: 0, failCommand: false };
  const request = vi.fn(async (input: URL, options: RequestInit) => {
    const url = new URL(input);
    if (url.hostname === "apigw.iotbing.com") {
      if (options.method === "POST")
        return Response.json({
          success: true,
          result: { qrcode: "fixture-qr-token" },
        });
      return Response.json({
        success: true,
        t: Date.now(),
        result: {
          endpoint: credentials.endpoint,
          terminal_id: credentials.terminalId,
          uid: credentials.token.uid,
          access_token: credentials.token.access_token,
          refresh_token: credentials.token.refresh_token,
          expire_time: 7200,
        },
      });
    }
    const headers = options.headers as Record<string, string>;
    const hash = createHash("md5")
      .update(headers["X-requestId"] + credentials.token.refresh_token)
      .digest("hex");
    const secret = createHmac("sha256", headers["X-requestId"])
      .update(hash)
      .digest("hex")
      .slice(0, 16);
    let result: unknown;
    if (url.pathname === "/v1.0/m/life/users/homes")
      result = [{ ownerId: "home-fixture" }];
    else if (
      url.pathname === "/v1.0/m/life/ha/home/devices" ||
      url.pathname === "/v1.0/m/life/ha/devices/detail"
    )
      result = [detail(state.power)];
    else if (url.pathname === "/v1.1/m/life/device-fixture/specifications")
      result = spec;
    else if (url.pathname === "/v1.1/m/thing/device-fixture/commands") {
      const body = (await decryptResponse(
        JSON.parse(String(options.body)).encdata,
        secret,
      )) as { commands: { code: string; value: boolean }[] };
      expect(body.commands).toHaveLength(1);
      expect(body.commands[0].code).toBe("switch");
      state.commands++;
      state.power = body.commands[0].value;
      if (state.failCommand) throw new Error("Test-only lost acknowledgement");
      result = true;
    } else throw new Error("Unexpected test provider endpoint");
    const nonce = Buffer.from("0123456789ab"),
      cipher = createCipheriv("aes-128-gcm", Buffer.from(secret), nonce);
    const encrypted = Buffer.concat([
      nonce,
      cipher.update(JSON.stringify(result)),
      cipher.final(),
      cipher.getAuthTag(),
    ]).toString("base64");
    return Response.json({ success: true, result: encrypted, t: Date.now() });
  });
  vi.stubGlobal("fetch", request);
  return state;
}
it("pairs via encrypted session-bound consent and controls only the discovered appliance without replay", async () => {
  const { sql, request } = await setup();
  const provider = mockProvider();
  const started = await (
    await request("/connect", { userCode: "user-code-fixture" })
  ).json();
  expect(started.qrData).toBe("tuyaSmart--qrLogin?token=fixture-qr-token");
  const pending = sql
    .prepare("SELECT encrypted FROM tuya_pairings")
    .get()?.encrypted;
  expect(String(pending)).not.toContain("user-code-fixture");
  const paired = await request("/poll", { connectionId: started.connectionId });
  expect(paired.status).toBe(200);
  expect((await paired.json()).state.humidity).toBe(63);
  expect(sql.prepare("SELECT COUNT(*) AS n FROM tuya_pairings").get()?.n).toBe(
    0,
  );
  expect(
    String(
      sql.prepare("SELECT encrypted FROM tuya_connections").get()?.encrypted,
    ),
  ).not.toContain("refresh-fixture");
  const action = {
    action: "on",
    requestId: "00000000-0000-4000-8000-000000000001",
  };
  expect((await (await request("/action", action)).json()).acknowledged).toBe(
    true,
  );
  expect((await (await request("/action", action)).json()).replay).toBe(true);
  expect(provider.commands).toBe(1);
  const current = await (await request("")).json();
  expect(current.state.power).toBe(true);
  expect(JSON.stringify(current)).not.toContain("access-fixture");
  expect(JSON.stringify(current)).not.toContain("device-fixture");
  expect(
    (
      await request("/action", {
        action: "set_humidity",
        requestId: action.requestId,
      })
    ).status,
  ).toBe(400);
  sql.close();
});
it("does not replay a device command when its provider acknowledgement is lost", async () => {
  const { sql, request } = await setup();
  const provider = mockProvider();
  const start = await (
    await request("/connect", { userCode: "user-code-fixture" })
  ).json();
  await request("/poll", { connectionId: start.connectionId });
  provider.failCommand = true;
  const action = {
    action: "on",
    requestId: "00000000-0000-4000-8000-000000000002",
  };
  expect((await (await request("/action", action)).json()).acknowledged).toBe(
    false,
  );
  expect((await (await request("/action", action)).json()).acknowledged).toBe(
    false,
  );
  expect(provider.commands).toBe(1);
  sql.close();
});
