import { decode } from "../src/state/storage";
import { readAlexaActions, triggerAlexa } from "./alexa";
import { handleTimerApi } from "./timerApi";
import { verifyTimerDispatch } from "./timerDispatch";
import { runTimers } from "./timers";
import { handleTuyaApi } from "./tuya/api";
import {
  cookie,
  readSession,
  SESSION_SECONDS,
  sessionToken,
  sha256,
  validVerifier,
  verifyPassword,
} from "./auth";
export interface Env {
  DB?: D1Database;
  TALIN_PASSWORD_HASH?: string;
  TALIN_ALEXA_TRIGGERS?: string;
  TALIN_TUYA_KEY?: string;
  TALIN_TIMER_TOKEN?: string;
}
const MAX_BODY = 32 * 1024;
function json(
  value: unknown,
  status = 200,
  extra: Record<string, string> = {},
): Response {
  return Response.json(value, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
      "X-Content-Type-Options": "nosniff",
      ...extra,
    },
  });
}
async function body(request: Request): Promise<unknown> {
  if (!request.headers.get("Content-Type")?.startsWith("application/json"))
    throw new Error("json");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("body");
  let length = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BODY) {
        await reader.cancel();
        throw new Error("large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const combined = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }
  return JSON.parse(new TextDecoder().decode(combined));
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}
async function authenticated(
  request: Request,
  db: D1Database,
): Promise<boolean> {
  const token = readSession(request);
  if (!token) return false;
  const row = await db
    .prepare(
      "SELECT expires_at FROM sessions WHERE token_hash = ? AND expires_at > ?",
    )
    .bind(await sha256(token), Date.now())
    .first();
  return Boolean(row);
}
export async function handleApi(request: Request, env: Env): Promise<Response> {
  try {
    return await route(request, env);
  } catch {
    return json({ error: "Service unavailable. Please retry later." }, 503);
  }
}
async function route(request: Request, env: Env): Promise<Response> {
  const path = new URL(request.url).pathname;
  if (path === "/api/timer-runner") {
    if (
      request.method !== "POST" ||
      !env.DB ||
      !(await verifyTimerDispatch(request, env.TALIN_TIMER_TOKEN))
    )
      return json({ error: "Not found" }, 404);
    await runTimers(env);
    return json({ acknowledged: true });
  }
  if (
    ![
      "/api/session",
      "/api/login",
      "/api/logout",
      "/api/preferences",
      "/api/device-actions",
      "/api/power-timers",
      "/api/tuya",
      "/api/tuya/connect",
      "/api/tuya/poll",
      "/api/tuya/action",
    ].includes(path)
  )
    return json({ error: "Not found" }, 404);
  if (request.method !== "GET" && request.method !== "HEAD") {
    if (
      request.headers.get("Origin") !== new URL(request.url).origin ||
      request.headers.get("X-Talin-Request") !== "1"
    )
      return json({ error: "Same-origin request required" }, 403);
  }
  const configured = Boolean(env.DB && validVerifier(env.TALIN_PASSWORD_HASH));
  if (path === "/api/session" && request.method === "GET")
    return json({
      configured,
      authenticated: configured ? await authenticated(request, env.DB!) : false,
    });
  if (!configured) return json({ error: "Cloud sync is not configured" }, 503);
  const db = env.DB!;
  if (path === "/api/login" && request.method === "POST") {
    const now = Date.now();
    const fingerprint = await sha256(
      `${request.headers.get("CF-Connecting-IP") || "local"}:${env.TALIN_PASSWORD_HASH!.split(":")[2]}`,
    );
    // One atomic upsert reserves the attempt before password work, including concurrent requests.
    const limit = await db
      .prepare(
        "INSERT INTO login_limits (fingerprint, attempts, window_start) VALUES (?, 1, ?) ON CONFLICT(fingerprint) DO UPDATE SET attempts = CASE WHEN window_start < ? THEN 1 ELSE attempts + 1 END, window_start = CASE WHEN window_start < ? THEN excluded.window_start ELSE window_start END RETURNING attempts",
      )
      .bind(fingerprint, now, now - 900000, now - 900000)
      .first<{ attempts: number }>();
    if (!limit || limit.attempts > 5)
      return json(
        { error: "Too many attempts. Try again in 15 minutes." },
        429,
        { "Retry-After": "900" },
      );
    let data;
    try {
      data = await body(request);
    } catch {
      return json({ error: "Invalid request" }, 400);
    }
    const password = (data as { password?: unknown })?.password;
    if (
      typeof password !== "string" ||
      password.length < 12 ||
      password.length > 256 ||
      !(await verifyPassword(password, env.TALIN_PASSWORD_HASH!))
    )
      return json({ error: "Sign-in failed" }, 401);
    const token = sessionToken();
    const previous = readSession(request);
    const statements = [
      db
        .prepare("INSERT INTO sessions (token_hash, expires_at) VALUES (?, ?)")
        .bind(await sha256(token), now + SESSION_SECONDS * 1000),
      db.prepare("DELETE FROM sessions WHERE expires_at <= ?").bind(now),
      db
        .prepare("DELETE FROM login_limits WHERE window_start < ?")
        .bind(now - 900000),
    ];
    if (previous)
      statements.push(
        db
          .prepare("DELETE FROM sessions WHERE token_hash = ?")
          .bind(await sha256(previous)),
      );
    await db.batch(statements);
    return json({ authenticated: true }, 200, { "Set-Cookie": cookie(token) });
  }
  if (!(await authenticated(request, db)))
    return json({ error: "Sign in to access household cloud services" }, 401);
  if (path.startsWith("/api/tuya")) return handleTuyaApi(request, env, body);
  if (path === "/api/power-timers") return handleTimerApi(request, env, body);
  if (path === "/api/device-actions") {
    const actions = readAlexaActions(env.TALIN_ALEXA_TRIGGERS);
    if (request.method === "GET")
      return json({
        devices: Object.fromEntries(
          Object.entries(actions).map(([id, value]) => [
            id,
            Object.keys(value),
          ]),
        ),
      });
    if (request.method === "POST") {
      let data: Record<string, unknown>;
      try {
        const input = await body(request);
        if (!input || typeof input !== "object" || Array.isArray(input))
          throw new Error();
        data = input as Record<string, unknown>;
      } catch {
        return json({ error: "Invalid command" }, 400);
      }
      const { deviceId, action, requestId } = data;
      if (
        Object.keys(data).sort().join(",") !== "action,deviceId,requestId" ||
        typeof deviceId !== "string" ||
        (action !== "on" && action !== "off") ||
        typeof requestId !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          requestId,
        )
      )
        return json({ error: "Invalid command" }, 400);
      const credential = actions[deviceId]?.[action];
      if (!credential)
        return json(
          { error: "This Alexa action is not connected and verified" },
          503,
        );
      const previous = await db
        .prepare(
          "SELECT device_id, action, acknowledged FROM alexa_commands WHERE request_id = ?",
        )
        .bind(requestId)
        .first<{ device_id: string; action: string; acknowledged: number }>();
      if (previous) {
        if (previous.device_id !== deviceId || previous.action !== action)
          return json(
            { error: "Request ID already used for another command" },
            409,
          );
        return json({
          acknowledged: previous.acknowledged === 1,
          outcome:
            previous.acknowledged === 1 ? "trigger-acknowledged" : "unknown",
          replay: true,
        });
      }
      const now = Date.now();
      // Reserve once, atomically, before contacting the provider. Never retry an uncertain command.
      const reserved = await db
        .prepare(
          "INSERT INTO alexa_commands (request_id, device_id, action, created_at) SELECT ?, ?, ?, ? WHERE (SELECT COUNT(*) FROM alexa_commands WHERE created_at > ?) < 6 AND (SELECT COUNT(*) FROM alexa_commands WHERE created_at > ?) < 200 ON CONFLICT(request_id) DO NOTHING",
        )
        .bind(requestId, deviceId, action, now, now - 60000, now - 86400000)
        .run();
      if (!reserved.meta.changes)
        return json(
          {
            error:
              "Command already submitted or household command limit reached. Do not retry automatically.",
          },
          429,
        );
      const acknowledged = await triggerAlexa(credential);
      if (acknowledged)
        await db
          .prepare(
            "UPDATE alexa_commands SET acknowledged = 1 WHERE request_id = ?",
          )
          .bind(requestId)
          .run();
      await db
        .prepare("DELETE FROM alexa_commands WHERE created_at < ?")
        .bind(now - 7 * 86400000)
        .run();
      return json({
        acknowledged,
        outcome: acknowledged ? "trigger-acknowledged" : "unknown",
      });
    }
    return json({ error: "Method not allowed" }, 405, { Allow: "GET, POST" });
  }
  if (path === "/api/logout" && request.method === "POST") {
    const token = readSession(request)!;
    await db
      .prepare("DELETE FROM sessions WHERE token_hash = ?")
      .bind(await sha256(token))
      .run();
    return json({ authenticated: false }, 200, { "Set-Cookie": cookie("", 0) });
  }
  if (path === "/api/preferences" && request.method === "GET") {
    const row = await db
      .prepare(
        "SELECT payload, revision, updated_at FROM preferences WHERE id = 1",
      )
      .first<{ payload: string; revision: number; updated_at: number }>();
    return json(
      row
        ? {
            state: JSON.parse(row.payload),
            revision: row.revision,
            updatedAt: row.updated_at,
          }
        : { state: null, revision: 0, updatedAt: null },
      200,
      { ETag: `"${row?.revision || 0}"` },
    );
  }
  if (path === "/api/preferences" && request.method === "PUT") {
    const match = request.headers.get("If-Match");
    if (!match || !/^"\d+"$/.test(match))
      return json({ error: "Read the current revision before saving" }, 428);
    let input;
    try {
      input = await body(request);
    } catch {
      return json({ error: "Invalid or oversized preferences" }, 400);
    }
    if (
      !input ||
      typeof input !== "object" ||
      (input as { version?: unknown }).version !== 1 ||
      canonical(input) !== canonical(decode(JSON.stringify(input)))
    )
      return json(
        {
          error:
            "Preferences must match the supported schema; unknown or sensitive fields are rejected",
        },
        400,
      );
    const revision = Number(match.slice(1, -1));
    const payload = JSON.stringify(input);
    let result;
    if (revision === 0)
      result = await db
        .prepare(
          "INSERT INTO preferences (id,payload,revision,updated_at) VALUES (1,?,1,?) ON CONFLICT(id) DO NOTHING",
        )
        .bind(payload, Date.now())
        .run();
    else
      result = await db
        .prepare(
          "UPDATE preferences SET payload = ?, revision = revision + 1, updated_at = ? WHERE id = 1 AND revision = ?",
        )
        .bind(payload, Date.now(), revision)
        .run();
    if (!result.meta.changes)
      return json(
        {
          error:
            "Preferences changed on another device. Load the latest copy before saving.",
        },
        409,
      );
    return json({ revision: revision + 1 }, 200, { ETag: `"${revision + 1}"` });
  }
  return json({ error: "Method not allowed" }, 405, {
    Allow:
      path === "/api/preferences"
        ? "GET, PUT"
        : path === "/api/session"
          ? "GET"
          : "POST",
  });
}
