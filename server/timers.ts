import { readAlexaActions, triggerAlexa } from "./alexa";
import type { Env } from "./api";
import { sha256 } from "./auth";

export interface TimerRow {
  id: string;
  device_id: string;
  action: "on" | "off";
  due_at: number;
  created_at: number;
  status: string;
}
export function publicTimer(row: TimerRow) {
  return {
    id: row.id,
    deviceId: row.device_id,
    action: row.action,
    dueAt: new Date(row.due_at).toISOString(),
    status: row.status,
  };
}
export async function runnerReady(
  db: D1Database,
  secret: string | undefined,
  now = Date.now(),
) {
  const row = await db
    .prepare("SELECT last_seen, config_hash FROM timer_runner WHERE id = 1")
    .first<{ last_seen: number; config_hash: string }>();
  return (
    !!row &&
    now >= row.last_seen &&
    now - row.last_seen <= 180000 &&
    row.config_hash === (await sha256(secret || ""))
  );
}
export async function runTimers(env: Env, now = Date.now()) {
  const db = env.DB;
  if (!db) return;
  const actions = readAlexaActions(env.TALIN_ALEXA_TRIGGERS);
  if (!Object.keys(actions).length) return;
  await db.batch([
    db
      .prepare(
        "INSERT INTO timer_runner(id,last_seen,config_hash) VALUES(1,?,?) ON CONFLICT(id) DO UPDATE SET last_seen = excluded.last_seen, config_hash = excluded.config_hash",
      )
      .bind(now, await sha256(env.TALIN_ALEXA_TRIGGERS || "")),
    db
      .prepare(
        "UPDATE power_timers SET status = 'expired' WHERE status = 'pending' AND due_at < ?",
      )
      .bind(now - 120000),
    db
      .prepare(
        "UPDATE power_timers SET status = 'unknown' WHERE status = 'claimed' AND due_at < ?",
      )
      .bind(now - 180000),
    db
      .prepare(
        "DELETE FROM power_timers WHERE created_at < ? AND status NOT IN ('pending','claimed')",
      )
      .bind(now - 7 * 86400000),
  ]);
  const due = await db
    .prepare(
      "SELECT * FROM power_timers WHERE status = 'pending' AND due_at <= ? ORDER BY due_at LIMIT 8",
    )
    .bind(now)
    .all<TimerRow>();
  for (const row of due.results) {
    const credential = actions[row.device_id]?.[row.action];
    const claim = await db
      .prepare(
        "UPDATE power_timers SET status = 'claimed' WHERE id = ? AND status = 'pending' AND due_at >= ? RETURNING id",
      )
      .bind(row.id, Date.now() - 120000)
      .first();
    if (!claim) continue;
    // Once claimed, a crash/timeout never causes automatic re-delivery.
    const acknowledged = credential ? await triggerAlexa(credential) : false;
    await db
      .prepare(
        "UPDATE power_timers SET status = ? WHERE id = ? AND status = 'claimed'",
      )
      .bind(acknowledged ? "acknowledged" : "unknown", row.id)
      .run();
  }
}
