import type { Env } from "../api";
import { readSession, sha256, sessionToken } from "../auth";
import {
  object,
  loginRequest,
  discoverDevice,
  getSnapshot,
  readSnapshot,
  executeTuya,
} from "./service";
import { validEndpoint, type TuyaCredentials } from "./protocol";
import { seal, unseal } from "./storage";
import { runnerReady, timerConfiguration } from "../timers";
const json = (value: unknown, status = 200) =>
  Response.json(value, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
    },
  });
interface Pending {
  userCode: string;
  qrToken?: string;
  credentials?: TuyaCredentials;
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function handleTuyaApi(
  request: Request,
  env: Env,
  readBody: (request: Request) => Promise<unknown>,
) {
  const key = env.TALIN_TUYA_KEY,
    db = env.DB!,
    path = new URL(request.url).pathname;
  if (!key || !/^[0-9a-f]{64}$/i.test(key))
    return request.method === "GET"
      ? json({ available: false, connected: false })
      : json(
          { error: "Secure Smart Life connection storage is not configured" },
          503,
        );
  const connection = await db
    .prepare("SELECT id FROM tuya_connections WHERE id = 1")
    .first();
  if (path === "/api/tuya" && request.method === "GET") {
    if (!connection) return json({ available: true, connected: false });
    try {
      return json({
        available: true,
        connected: true,
        state: await getSnapshot(db, key),
        timerReady: await runnerReady(db, timerConfiguration(env)),
      });
    } catch {
      return json({
        available: true,
        connected: true,
        error:
          "Smart Life state could not be refreshed. Existing readings are not current.",
      });
    }
  }
  if (request.method !== "POST")
    return json({ error: "Method not allowed" }, 405);
  let data: Record<string, unknown>;
  try {
    data = object(await readBody(request));
  } catch {
    return json({ error: "Invalid request" }, 400);
  }
  if (path === "/api/tuya/connect") {
    if (
      Object.keys(data).some((k) => k !== "userCode" && k !== "replace") ||
      typeof data.userCode !== "string" ||
      !/^[A-Za-z0-9_-]{4,128}$/.test(data.userCode)
    )
      return json({ error: "Enter the User Code from Smart Life" }, 400);
    if (connection && data.replace !== true)
      return json(
        { error: "Confirm replacement of the existing Smart Life connection" },
        409,
      );
    const now = Date.now(),
      id = sessionToken(),
      owner = await sha256(readSession(request)!);
    const initial = await seal({ userCode: data.userCode }, key);
    const inserted = await db
      .prepare(
        "INSERT INTO tuya_pairings(id,owner_hash,encrypted,created_at,expires_at) SELECT ?,?,?,?,? WHERE (SELECT COUNT(*) FROM tuya_pairings WHERE created_at > ?) < 5",
      )
      .bind(id, owner, initial, now, now + 240000, now - 900000)
      .run();
    if (!inserted.meta.changes)
      return json(
        { error: "Too many connection attempts. Wait 15 minutes." },
        429,
      );
    const response = await loginRequest(
      "/v1.0/m/life/home-assistant/qrcode/tokens",
      { usercode: data.userCode, schema: "haauthorize" },
      "POST",
    );
    const result = response.success === true ? object(response.result) : {};
    if (typeof result.qrcode !== "string" || result.qrcode.length > 512)
      return json(
        { error: "Tuya did not issue a consent QR. Check the User Code." },
        503,
      );
    await db
      .prepare("UPDATE tuya_pairings SET encrypted = ? WHERE id = ?")
      .bind(
        await seal({ userCode: data.userCode, qrToken: result.qrcode }, key),
        id,
      )
      .run();
    await db
      .prepare("DELETE FROM tuya_pairings WHERE created_at < ?")
      .bind(now - 86400000)
      .run();
    return json({
      connectionId: id,
      qrData: `tuyaSmart--qrLogin?token=${result.qrcode}`,
    });
  }
  if (path === "/api/tuya/poll") {
    if (
      Object.keys(data).join(",") !== "connectionId" ||
      typeof data.connectionId !== "string" ||
      !/^[0-9a-f]{64}$/.test(data.connectionId)
    )
      return json({ error: "Invalid connection request" }, 400);
    const now = Date.now(),
      owner = await sha256(readSession(request)!);
    const pending = await db
      .prepare(
        "UPDATE tuya_pairings SET lease_until = ? WHERE id = ? AND owner_hash = ? AND expires_at > ? AND lease_until < ? RETURNING encrypted",
      )
      .bind(now + 60000, data.connectionId, owner, now, now)
      .first<{ encrypted: string }>();
    if (!pending)
      return json(
        {
          error:
            "This QR has expired or is being checked. Start a new connection if needed.",
        },
        409,
      );
    try {
      const saved = await unseal<Pending>(pending.encrypted, key);
      let credentials = saved.credentials;
      if (!credentials) {
        if (!saved.qrToken) throw new Error("Missing consent QR");
        const response = await loginRequest(
          `/v1.0/m/life/home-assistant/qrcode/tokens/${encodeURIComponent(saved.qrToken)}`,
          { usercode: saved.userCode },
          "GET",
        );
        if (response.success !== true) return json({ pending: true });
        const info = object(response.result);
        if (
          typeof info.endpoint !== "string" ||
          !validEndpoint(info.endpoint) ||
          typeof info.terminal_id !== "string" ||
          typeof info.access_token !== "string" ||
          typeof info.refresh_token !== "string" ||
          typeof info.uid !== "string" ||
          typeof info.expire_time !== "number" ||
          typeof response.t !== "number"
        )
          return json(
            {
              error:
                "Unexpected Tuya connection details. No connection was saved.",
            },
            503,
          );
        credentials = {
          userCode: saved.userCode,
          endpoint: info.endpoint,
          terminalId: info.terminal_id,
          deviceId: "",
          token: {
            t: response.t,
            uid: info.uid,
            expire_time: info.expire_time,
            access_token: info.access_token,
            refresh_token: info.refresh_token,
          },
        };
        await db
          .prepare("UPDATE tuya_pairings SET encrypted = ? WHERE id = ?")
          .bind(
            await seal({ userCode: saved.userCode, credentials }, key),
            data.connectionId,
          )
          .run();
      }
      credentials.deviceId = await discoverDevice(credentials);
      const state = await readSnapshot(credentials),
        encrypted = await seal(credentials, key);
      await db.batch([
        db
          .prepare(
            "INSERT INTO tuya_connections(id,encrypted,snapshot,snapshot_at) VALUES(1,?,?,?) ON CONFLICT(id) DO UPDATE SET encrypted = excluded.encrypted, snapshot = excluded.snapshot, snapshot_at = excluded.snapshot_at, revision = tuya_connections.revision + 1, lease_until = 0",
          )
          .bind(encrypted, JSON.stringify(state), Date.parse(state.observedAt)),
        db
          .prepare("DELETE FROM tuya_pairings WHERE id = ? AND owner_hash = ?")
          .bind(data.connectionId, owner),
      ]);
      return json({ connected: true, state });
    } finally {
      await db
        .prepare("UPDATE tuya_pairings SET lease_until = 0 WHERE id = ?")
        .bind(data.connectionId)
        .run();
    }
  }
  if (path === "/api/tuya/action") {
    if (
      Object.keys(data).sort().join(",") !== "action,requestId" ||
      typeof data.requestId !== "string" ||
      !uuid.test(data.requestId) ||
      (data.action !== "on" &&
        data.action !== "off" &&
        data.action !== "2h" &&
        data.action !== "cancel")
    )
      return json({ error: "Unsupported appliance command" }, 400);
    if (!connection) return json({ error: "Smart Life is not connected" }, 503);
    return json(await executeTuya(db, key, data.action, data.requestId));
  }
  return json({ error: "Not found" }, 404);
}
