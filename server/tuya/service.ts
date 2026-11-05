import {
  CLIENT_ID,
  refreshToken,
  signedRequest,
  validEndpoint,
  type TuyaCredentials,
} from "./protocol";
import { seal, unseal } from "./storage";
import type { TuyaSnapshot } from "../../src/devices/tuya";
type ObjectValue = Record<string, unknown>;
export function object(value: unknown): ObjectValue {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Unexpected provider data");
  return value as ObjectValue;
}
function list(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new Error("Unexpected provider list");
  return value;
}
function parseValues(value: unknown): ObjectValue {
  try {
    return object(JSON.parse(String(value)));
  } catch {
    return {};
  }
}
export function snapshot(
  detail: unknown,
  specification: unknown,
  now = Date.now(),
): TuyaSnapshot {
  const device = object(detail),
    spec = object(specification);
  if (
    device.category !== "cs" ||
    device.product_name !== "DEV_19" ||
    typeof device.online !== "boolean"
  )
    throw new Error("Unexpected appliance identity or state");
  const status = Object.fromEntries(
    list(device.status).map((v) => {
      const item = object(v);
      return [String(item.code), item.value];
    }),
  );
  const functions = list(spec.functions).map(object),
    ranges = list(spec.status).map(object);
  const humidityRange = ranges.find(
    (v) => v.code === "humidity_indoor" && v.type === "Integer",
  );
  const humidityValues = parseValues(humidityRange?.values);
  const humidity =
    humidityRange &&
    humidityValues.unit === "%" &&
    humidityValues.scale === 0 &&
    typeof status.humidity_indoor === "number" &&
    Number.isInteger(status.humidity_indoor) &&
    status.humidity_indoor >= 0 &&
    status.humidity_indoor <= 100
      ? status.humidity_indoor
      : null;
  const countdown = functions.find(
    (v) => v.code === "countdown_set" && v.type === "Enum",
  );
  const options = parseValues(countdown?.values).range;
  return {
    online: device.online,
    power: typeof status.switch === "boolean" ? status.switch : null,
    humidity,
    observedAt: new Date(now).toISOString(),
    measurementTime: null,
    canPower:
      functions.some((v) => v.code === "switch" && v.type === "Boolean") &&
      typeof status.switch === "boolean",
    countdownOptions: Array.isArray(options)
      ? options.filter((v) => v === "cancel" || v === "2h")
      : [],
    countdownSetting:
      typeof status.countdown_set === "string" ? status.countdown_set : null,
    countdownLeft:
      typeof status.countdown_left === "number" &&
      Number.isInteger(status.countdown_left) &&
      status.countdown_left >= 0 &&
      status.countdown_left <= 480
        ? status.countdown_left
        : null,
  };
}
export async function readSnapshot(credentials: TuyaCredentials) {
  const detail = await signedRequest(
    credentials,
    "GET",
    "/v1.0/m/life/ha/devices/detail",
    { devIds: credentials.deviceId },
  );
  const device = list(detail.result)
    .map(object)
    .find((d) => d.id === credentials.deviceId);
  if (!device) throw new Error("Appliance not available");
  const spec = await signedRequest(
    credentials,
    "GET",
    `/v1.1/m/life/${encodeURIComponent(credentials.deviceId)}/specifications`,
  );
  return snapshot(device, spec.result);
}
export async function withConnection<T>(
  db: D1Database,
  key: string,
  run: (credentials: TuyaCredentials) => Promise<T>,
): Promise<T> {
  const now = Date.now();
  const row = await db
    .prepare(
      "UPDATE tuya_connections SET lease_until = ?, revision = revision + 1 WHERE id = 1 AND lease_until < ? RETURNING encrypted, revision",
    )
    .bind(now + 60000, now)
    .first<{ encrypted: string; revision: number }>();
  if (!row) throw new Error("Tuya connection is busy or not configured");
  try {
    const credentials = await unseal<TuyaCredentials>(row.encrypted, key);
    if (
      !validEndpoint(credentials.endpoint) ||
      !/^[A-Za-z0-9_-]{4,100}$/.test(credentials.deviceId)
    )
      throw new Error("Invalid connection configuration");
    await refreshToken(credentials, async (token) => {
      const encrypted = await seal({ ...credentials, token }, key);
      const saved = await db
        .prepare(
          "UPDATE tuya_connections SET encrypted = ? WHERE id = 1 AND revision = ?",
        )
        .bind(encrypted, row.revision)
        .run();
      if (!saved.meta.changes)
        throw new Error("Connection changed during token refresh");
    });
    return await run(credentials);
  } finally {
    await db
      .prepare(
        "UPDATE tuya_connections SET lease_until = 0 WHERE id = 1 AND revision = ?",
      )
      .bind(row.revision)
      .run();
  }
}
export async function getSnapshot(db: D1Database, key: string) {
  const row = await db
    .prepare("SELECT snapshot, snapshot_at FROM tuya_connections WHERE id = 1")
    .first<{ snapshot: string | null; snapshot_at: number | null }>();
  if (row?.snapshot && row.snapshot_at && Date.now() - row.snapshot_at < 30000)
    return JSON.parse(row.snapshot) as TuyaSnapshot;
  return withConnection(db, key, async (credentials) => {
    const state = await readSnapshot(credentials);
    await db
      .prepare(
        "UPDATE tuya_connections SET snapshot = ?, snapshot_at = ? WHERE id = 1",
      )
      .bind(JSON.stringify(state), Date.parse(state.observedAt))
      .run();
    return state;
  });
}
export async function executeTuya(
  db: D1Database,
  key: string,
  action: "on" | "off" | "2h" | "cancel",
  requestId: string,
) {
  const existing = await db
    .prepare("SELECT action, acknowledged FROM tuya_commands WHERE id = ?")
    .bind(requestId)
    .first<{ action: string; acknowledged: number }>();
  if (existing) {
    if (existing.action !== action) throw new Error("Request ID already used");
    return { acknowledged: existing.acknowledged === 1, replay: true };
  }
  // Read and capability-check before reserving. Never send an arbitrary DP or value.
  const state = await getSnapshot(db, key);
  if (!state.online || !state.canPower)
    throw new Error("Appliance is offline or power capability is unavailable");
  if (
    (action === "2h" || action === "cancel") &&
    (!state.countdownOptions.includes(action) ||
      (action === "2h" && state.power !== true))
  )
    throw new Error("Native countdown is unavailable in this state");
  const now = Date.now();
  const saved = await db
    .prepare(
      "INSERT INTO tuya_commands(id,action,created_at) SELECT ?,?,? WHERE (SELECT COUNT(*) FROM tuya_commands WHERE created_at > ?) < 6 AND (SELECT COUNT(*) FROM tuya_commands WHERE created_at > ?) < 200 ON CONFLICT(id) DO NOTHING",
    )
    .bind(requestId, action, now, now - 60000, now - 86400000)
    .run();
  if (!saved.meta.changes)
    throw new Error("Command submitted or household limit reached");
  let acknowledged = false;
  try {
    await withConnection(db, key, async (credentials) => {
      await signedRequest(
        credentials,
        "POST",
        `/v1.1/m/thing/${encodeURIComponent(credentials.deviceId)}/commands`,
        undefined,
        {
          commands: [
            {
              code:
                action === "on" || action === "off"
                  ? "switch"
                  : "countdown_set",
              value:
                action === "on" || action === "off" ? action === "on" : action,
            },
          ],
        },
      );
    });
    acknowledged = true;
    await db
      .prepare("UPDATE tuya_commands SET acknowledged = 1 WHERE id = ?")
      .bind(requestId)
      .run();
  } catch {
    /* An uncertain command is never replayed automatically. */
  }
  await db.batch([
    db.prepare("UPDATE tuya_connections SET snapshot_at = 0 WHERE id = 1"),
    db
      .prepare("DELETE FROM tuya_commands WHERE created_at < ?")
      .bind(now - 7 * 86400000),
  ]);
  return { acknowledged, replay: false };
}
export async function discoverDevice(credentials: TuyaCredentials) {
  const homes = await signedRequest(
    credentials,
    "GET",
    "/v1.0/m/life/users/homes",
  );
  const matches: ObjectValue[] = [];
  for (const home of list(homes.result).slice(0, 8).map(object)) {
    const response = await signedRequest(
      credentials,
      "GET",
      "/v1.0/m/life/ha/home/devices",
      { homeId: String(home.ownerId) },
    );
    for (const device of list(response.result).map(object))
      if (device.category === "cs" && device.product_name === "DEV_19")
        matches.push(device);
  }
  if (
    matches.length !== 1 ||
    typeof matches[0].id !== "string" ||
    !/^[A-Za-z0-9_-]{4,100}$/.test(matches[0].id)
  )
    throw new Error("Expected one DEV_19 appliance; no connection saved");
  return matches[0].id;
}
export async function loginRequest(
  path: string,
  query: Record<string, string>,
  method: "GET" | "POST",
) {
  const url = new URL(path, "https://apigw.iotbing.com");
  url.search = new URLSearchParams({
    clientid: CLIENT_ID,
    ...query,
  }).toString();
  const controller = new AbortController(),
    timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, {
      method,
      signal: controller.signal,
      // Workers supports manual redirects; reject non-2xx before reading data.
      // Never forward credentials to a provider-supplied redirect destination.
      redirect: "manual",
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Tuya sign-in unavailable");
    return object(await response.json());
  } finally {
    clearTimeout(timeout);
  }
}
