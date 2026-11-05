import { readAlexaActions, triggerAlexa } from "./alexa";
import type { Env } from "./api";
import { sha256 } from "./auth";
import { executeTuya } from "./tuya/service";
export function timerConfiguration(env: Env) {
  return env.TALIN_TUYA_KEY
    ? JSON.stringify({
        alexa: readAlexaActions(env.TALIN_ALEXA_TRIGGERS),
        tuya: env.TALIN_TUYA_KEY,
      })
    : env.TALIN_ALEXA_TRIGGERS || "";
}

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
  // Retain rate-limit metadata briefly, but discard expired QR credentials.
  await db.batch([
    db
      .prepare(
        "UPDATE tuya_pairings SET encrypted = '' WHERE expires_at < ? AND encrypted <> ''",
      )
      .bind(now),
    db
      .prepare("DELETE FROM tuya_pairings WHERE created_at < ?")
      .bind(now - 86400000),
  ]);
  const actions = readAlexaActions(env.TALIN_ALEXA_TRIGGERS);
  const directTuya =
    !!env.TALIN_TUYA_KEY &&
    !!(await db
      .prepare("SELECT id FROM tuya_connections WHERE id = 1")
      .first());
  if (!Object.keys(actions).length && !directTuya) return;
  await db.batch([
    db
      .prepare(
        "INSERT INTO timer_runner(id,last_seen,config_hash) VALUES(1,?,?) ON CONFLICT(id) DO UPDATE SET last_seen = excluded.last_seen, config_hash = excluded.config_hash",
      )
      .bind(now, await sha256(timerConfiguration(env))),
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
    let acknowledged = false;
    try {
      acknowledged =
        row.device_id === "tuya-dehumidifier" && directTuya
          ? (await executeTuya(db, env.TALIN_TUYA_KEY!, row.action, row.id))
              .acknowledged
          : credential
            ? await triggerAlexa(credential)
            : false;
    } catch {
      /* Keep an uncertain timer claimed; never auto-retry it. */
    }
    await db
      .prepare(
        "UPDATE power_timers SET status = ? WHERE id = ? AND status = 'claimed'",
      )
      .bind(acknowledged ? "acknowledged" : "unknown", row.id)
      .run();
  }
}
