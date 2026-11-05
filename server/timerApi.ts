import { readAlexaActions } from "./alexa";
import type { Env } from "./api";
import { publicTimer, runnerReady, type TimerRow } from "./timers";
const response = (value: unknown, status = 200) =>
  Response.json(value, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
export async function handleTimerApi(
  request: Request,
  env: Env,
  readBody: (request: Request) => Promise<unknown>,
) {
  const db = env.DB!;
  if (request.method === "GET") {
    const rows = await db
      .prepare("SELECT * FROM power_timers ORDER BY created_at DESC LIMIT 32")
      .all<TimerRow>();
    return response({
      ready: await runnerReady(db, env.TALIN_ALEXA_TRIGGERS),
      timers: rows.results.map(publicTimer),
    });
  }
  if (request.method !== "POST")
    return response({ error: "Method not allowed" }, 405);
  let data: Record<string, unknown>;
  try {
    const input = await readBody(request);
    if (!input || typeof input !== "object" || Array.isArray(input))
      throw new Error();
    data = input as Record<string, unknown>;
  } catch {
    return response({ error: "Invalid timer request" }, 400);
  }
  const { operation, id } = data;
  if (
    typeof id !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  )
    return response({ error: "Invalid timer ID" }, 400);
  if (
    operation === "cancel" &&
    Object.keys(data).sort().join(",") === "id,operation"
  ) {
    const row = await db
      .prepare(
        "UPDATE power_timers SET status = 'cancelled' WHERE id = ? AND status = 'pending' RETURNING *",
      )
      .bind(id)
      .first<TimerRow>();
    return row
      ? response({ timer: publicTimer(row) })
      : response(
          {
            error:
              "Timer is no longer pending. Refresh its outcome; cancellation is not confirmed.",
          },
          409,
        );
  }
  const { deviceId, action, seconds } = data;
  if (
    operation !== "create" ||
    Object.keys(data).sort().join(",") !==
      "action,deviceId,id,operation,seconds" ||
    typeof deviceId !== "string" ||
    (action !== "on" && action !== "off") ||
    typeof seconds !== "number" ||
    !Number.isInteger(seconds) ||
    seconds < 120 ||
    seconds > 86400
  )
    return response(
      { error: "Choose an action and a countdown from 2 minutes to 24 hours" },
      400,
    );
  if (
    !readAlexaActions(env.TALIN_ALEXA_TRIGGERS)[deviceId]?.[action] ||
    !(await runnerReady(db, env.TALIN_ALEXA_TRIGGERS))
  )
    return response(
      {
        error:
          "Verified Alexa action and a healthy cloud timer runner are required",
      },
      503,
    );
  const existing = await db
    .prepare("SELECT * FROM power_timers WHERE id = ?")
    .bind(id)
    .first<TimerRow>();
  if (existing)
    return existing.device_id === deviceId &&
      existing.action === action &&
      existing.due_at - existing.created_at === seconds * 1000
      ? response({ timer: publicTimer(existing) })
      : response({ error: "Timer ID already used" }, 409);
  const now = Date.now();
  const row = await db
    .prepare(
      "INSERT INTO power_timers(id,device_id,action,due_at,created_at) SELECT ?,?,?,?,? WHERE (SELECT COUNT(*) FROM power_timers WHERE status = 'pending') < 8 AND (SELECT COUNT(*) FROM power_timers WHERE created_at > ?) < 24 ON CONFLICT(id) DO NOTHING RETURNING *",
    )
    .bind(id, deviceId, action, now + seconds * 1000, now, now - 86400000)
    .first<TimerRow>();
  return row
    ? response({ timer: publicTimer(row) }, 201)
    : response(
        {
          error:
            "Household timer limit reached or request already submitted. Refresh before retrying.",
        },
        429,
      );
}
