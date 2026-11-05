import type { ComputerSnapshot } from "../src/computers/model";
import { sha256 } from "./auth";
export const computerId = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const json = (data: unknown, status = 200) =>
  Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const text = (value: unknown, max: number): value is string =>
  typeof value === "string" &&
  value.length > 0 &&
  value.length <= max &&
  [...value].every((character) => character.charCodeAt(0) >= 32);
const number = (value: unknown, min: number, max: number): value is number =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= min &&
  value <= max;
const capabilities = [
  "masterVolume",
  "masterMute",
  "sessionVolume",
  "sessionMute",
  "microphoneMute",
  "mediaPlayPause",
  "mediaPrevious",
  "mediaNext",
  "showDesktop",
  "taskManager",
];
export function computerSnapshot(
  value: unknown,
  now = Date.now(),
): ComputerSnapshot | null {
  if (
    !record(value) ||
    !text(value.sampledAt, 32) ||
    !Number.isFinite(Date.parse(value.sampledAt)) ||
    Math.abs(now - Date.parse(value.sampledAt)) > 60000 ||
    !(value.cpuPercent === null || number(value.cpuPercent, 0, 100)) ||
    !number(value.memoryTotalMb, 1, 4194304) ||
    !number(value.memoryUsedMb, 0, value.memoryTotalMb) ||
    !Array.isArray(value.capabilities) ||
    value.capabilities.length > capabilities.length ||
    value.capabilities.some((v) => !capabilities.includes(v))
  )
    return null;
  let gpu: ComputerSnapshot["gpu"] = null;
  if (value.gpu !== null) {
    const v = value.gpu;
    if (
      !record(v) ||
      !text(v.name, 128) ||
      !number(v.loadPercent, 0, 100) ||
      !number(v.temperatureC, -40, 150) ||
      !number(v.memoryTotalMb, 1, 1048576) ||
      !number(v.memoryUsedMb, 0, v.memoryTotalMb)
    )
      return null;
    gpu = {
      name: v.name,
      loadPercent: v.loadPercent,
      temperatureC: v.temperatureC,
      memoryUsedMb: v.memoryUsedMb,
      memoryTotalMb: v.memoryTotalMb,
    };
  }
  let audio: ComputerSnapshot["audio"] = null;
  if (value.audio !== null) {
    const v = value.audio;
    if (
      !record(v) ||
      !number(v.volume, 0, 100) ||
      typeof v.muted !== "boolean" ||
      !text(v.output, 128) ||
      !(v.microphoneMuted === null || typeof v.microphoneMuted === "boolean") ||
      !Array.isArray(v.sessions) ||
      v.sessions.length > 32
    )
      return null;
    const sessions: NonNullable<ComputerSnapshot["audio"]>["sessions"] = [];
    for (const s of v.sessions) {
      if (
        !record(s) ||
        !text(s.id, 256) ||
        !text(s.name, 80) ||
        !number(s.volume, 0, 100) ||
        typeof s.muted !== "boolean"
      )
        return null;
      sessions.push({
        id: s.id,
        name: s.name,
        volume: s.volume,
        muted: s.muted,
      });
    }
    audio = {
      volume: v.volume,
      muted: v.muted,
      output: v.output,
      microphoneMuted: v.microphoneMuted,
      sessions,
    };
  }
  return {
    sampledAt: value.sampledAt,
    cpuPercent: value.cpuPercent,
    memoryUsedMb: value.memoryUsedMb,
    memoryTotalMb: value.memoryTotalMb,
    gpu,
    audio,
    capabilities: [...new Set(value.capabilities)] as string[],
  };
}
export function computerCommand(
  value: unknown,
  snapshot: ComputerSnapshot,
): Record<string, unknown> | null {
  if (
    !record(value) ||
    typeof value.action !== "string" ||
    !snapshot.capabilities.includes(value.action)
  )
    return null;
  const action = value.action;
  if (["masterVolume", "sessionVolume"].includes(action)) {
    if (!number(value.value, 0, 100) || !Number.isInteger(value.value))
      return null;
    if (action === "masterVolume") return { action, value: value.value };
    if (
      typeof value.sessionId !== "string" ||
      !snapshot.audio?.sessions.some((s) => s.id === value.sessionId)
    )
      return null;
    return { action, value: value.value, sessionId: value.sessionId };
  }
  if (["masterMute", "sessionMute", "microphoneMute"].includes(action)) {
    if (typeof value.value !== "boolean") return null;
    if (action !== "sessionMute") return { action, value: value.value };
    if (
      typeof value.sessionId !== "string" ||
      !snapshot.audio?.sessions.some((s) => s.id === value.sessionId)
    )
      return null;
    return { action, value: value.value, sessionId: value.sessionId };
  }
  return capabilities.includes(action) ? { action } : null;
}
export async function handleComputerAgent(
  request: Request,
  db: D1Database,
  body: (request: Request) => Promise<unknown>,
) {
  if (request.method !== "POST") return json({ error: "Not found" }, 404);
  const bearer = request.headers.get("Authorization") || "";
  if (!/^Bearer [0-9a-f]{64}$/i.test(bearer))
    return json({ error: "Unauthorised companion" }, 401);
  const pc = await db
    .prepare(
      "SELECT id,active_until FROM computers WHERE token_hash=? AND revoked=0",
    )
    .bind(await sha256(bearer.slice(7)))
    .first<{ id: string; active_until: number }>();
  if (!pc) return json({ error: "Unauthorised companion" }, 401);
  let data: unknown;
  try {
    data = await body(request);
  } catch {
    return json({ error: "Invalid report" }, 400);
  }
  if (!record(data)) return json({ error: "Invalid report" }, 400);
  const now = Date.now(),
    snapshot = computerSnapshot(data.snapshot, now);
  if (!snapshot) return json({ error: "Invalid report" }, 400);
  if (data.completed != null) {
    const v = data.completed;
    if (!record(v) || !computerId(v.id) || typeof v.ok !== "boolean")
      return json({ error: "Invalid result" }, 400);
    await db
      .prepare(
        "UPDATE computer_commands SET status=?,result=? WHERE id=? AND computer_id=? AND status='claimed'",
      )
      .bind(
        v.ok ? "acknowledged" : "failed",
        v.ok
          ? "Companion acknowledged; inspect readback"
          : "Companion did not confirm execution",
        v.id,
        pc.id,
      )
      .run();
  }
  await db.batch([
    db
      .prepare(
        "UPDATE computers SET snapshot=?,last_seen=? WHERE id=? AND revoked=0",
      )
      .bind(JSON.stringify(snapshot), now, pc.id),
    db
      .prepare(
        "UPDATE computer_commands SET status='expired' WHERE computer_id=? AND status='pending' AND created_at<?",
      )
      .bind(pc.id, now - 20000),
    db
      .prepare(
        "UPDATE computer_commands SET status='unknown' WHERE computer_id=? AND status='claimed' AND created_at<?",
      )
      .bind(pc.id, now - 120000),
    db
      .prepare(
        "DELETE FROM computer_commands WHERE computer_id=? AND created_at<?",
      )
      .bind(pc.id, now - 7 * 86400000),
  ]);
  const command = await db
    .prepare(
      "UPDATE computer_commands SET status='claimed' WHERE id=(SELECT id FROM computer_commands WHERE computer_id=? AND status='pending' AND created_at>=? AND EXISTS(SELECT 1 FROM computers WHERE id=computer_commands.computer_id AND revoked=0) ORDER BY created_at LIMIT 1) AND status='pending' RETURNING id,payload",
    )
    .bind(pc.id, now - 20000)
    .first<{ id: string; payload: string }>();
  return json({
    pollSeconds: pc.active_until > now ? 5 : 15,
    command: command
      ? { id: command.id, ...JSON.parse(command.payload) }
      : null,
  });
}
export async function handleComputers(
  request: Request,
  db: D1Database,
  body: (request: Request) => Promise<unknown>,
) {
  const now = Date.now();
  if (request.method === "GET") {
    const rows = await db
      .prepare(
        "SELECT id,name,platform,snapshot,last_seen FROM computers WHERE revoked=0 ORDER BY name LIMIT 8",
      )
      .all<{
        id: string;
        name: string;
        platform: string;
        snapshot: string | null;
        last_seen: number;
      }>();
    return json({
      computers: rows.results.map((r) => ({
        id: r.id,
        name: r.name,
        platform: r.platform,
        lastSeen: r.last_seen,
        online: now - r.last_seen < 30000,
        snapshot: r.snapshot ? JSON.parse(r.snapshot) : null,
      })),
    });
  }
  if (request.method !== "POST")
    return json({ error: "Method not allowed" }, 405);
  let data: unknown;
  try {
    data = await body(request);
  } catch {
    return json({ error: "Invalid request" }, 400);
  }
  if (!record(data)) return json({ error: "Invalid request" }, 400);
  if (data.operation === "pair") {
    if (
      !computerId(data.id) ||
      !text(data.name, 64) ||
      !["Windows", "macOS"].includes(String(data.platform)) ||
      typeof data.tokenHash !== "string" ||
      !/^[0-9a-f]{64}$/.test(data.tokenHash)
    )
      return json({ error: "Invalid pairing request" }, 400);
    const result = await db
      .prepare(
        "INSERT INTO computers(id,name,platform,token_hash) SELECT ?,?,?,? WHERE (SELECT COUNT(*) FROM computers WHERE revoked=0)<8 ON CONFLICT(id) DO NOTHING",
      )
      .bind(data.id, data.name, data.platform, data.tokenHash)
      .run();
    return json(
      { paired: !!result.meta.changes },
      result.meta.changes ? 201 : 409,
    );
  }
  if (!computerId(data.computerId))
    return json({ error: "Invalid computer" }, 400);
  const pc = await db
    .prepare(
      "SELECT id,snapshot,last_seen FROM computers WHERE id=? AND revoked=0",
    )
    .bind(data.computerId)
    .first<{ id: string; snapshot: string | null; last_seen: number }>();
  if (!pc) return json({ error: "Computer not found" }, 404);
  if (data.operation === "revoke") {
    await db.batch([
      db
        .prepare(
          "UPDATE computers SET revoked=1,snapshot=NULL,last_seen=0 WHERE id=?",
        )
        .bind(pc.id),
      db
        .prepare(
          "UPDATE computer_commands SET status='expired' WHERE computer_id=? AND status='pending'",
        )
        .bind(pc.id),
    ]);
    return json({ revoked: true });
  }
  if (data.operation === "watch") {
    await db
      .prepare("UPDATE computers SET active_until=? WHERE id=? AND revoked=0")
      .bind(now + 45000, pc.id)
      .run();
    return json({ watching: true });
  }
  if (data.operation === "result" && computerId(data.id)) {
    const result = await db
      .prepare(
        "SELECT status,result FROM computer_commands WHERE id=? AND computer_id=?",
      )
      .bind(data.id, pc.id)
      .first();
    return json(result || { status: "unknown" });
  }
  if (
    data.operation !== "command" ||
    !computerId(data.id) ||
    !pc.snapshot ||
    now - pc.last_seen >= 30000
  )
    return json({ error: "Computer is unavailable or report is stale" }, 409);
  const command = computerCommand(data.command, JSON.parse(pc.snapshot));
  if (!command)
    return json({ error: "Unsupported command or invalid value" }, 400);
  const old = await db
    .prepare(
      "SELECT computer_id,payload,status FROM computer_commands WHERE id=?",
    )
    .bind(data.id)
    .first<{ computer_id: string; payload: string; status: string }>();
  if (old)
    return old.computer_id === pc.id && old.payload === JSON.stringify(command)
      ? json({ id: data.id, status: old.status, replay: true })
      : json({ error: "Request ID already used" }, 409);
  const inserted = await db
    .prepare(
      "INSERT INTO computer_commands(id,computer_id,payload,created_at) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM computers WHERE id=? AND revoked=0 AND last_seen>=?) AND (SELECT COUNT(*) FROM computer_commands WHERE computer_id=? AND created_at>?)<20 AND (SELECT COUNT(*) FROM computer_commands WHERE created_at>?)<1000 ON CONFLICT(id) DO NOTHING",
    )
    .bind(
      data.id,
      pc.id,
      JSON.stringify(command),
      now,
      pc.id,
      now - 30000,
      pc.id,
      now - 60000,
      now - 86400000,
    )
    .run();
  if (!inserted.meta.changes)
    return json({ error: "Command already submitted or rate limited" }, 429);
  await db
    .prepare("UPDATE computers SET active_until=? WHERE id=? AND revoked=0")
    .bind(now + 45000, pc.id)
    .run();
  return json(
    { id: data.id, status: "pending", message: "Queued, not yet executed" },
    202,
  );
}
