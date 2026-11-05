import { tuyaRequest } from "../data/TuyaContext";
import { commandId } from "./commandId";
import type { TimerAdapter } from "./powerTimers";
import type { PowerTimer } from "./powerTimers";
interface TimerRow {
  id: string;
  deviceId: string;
  action: "on" | "off";
  dueAt: string;
  status: PowerTimer["status"];
}
const timerValue = (row: TimerRow): PowerTimer => ({
  id: row.id,
  power: row.action === "on",
  dueAt: row.dueAt,
  executor: "service",
  status: row.status,
});
async function timers(signal: AbortSignal, data?: unknown) {
  const response = await fetch("/api/power-timers", {
    method: data ? "POST" : "GET",
    headers: { "Content-Type": "application/json", "X-Talin-Request": "1" },
    body: data ? JSON.stringify(data) : undefined,
    cache: "no-store",
    signal,
  });
  if (!response.ok) throw new Error("Timer outcome not confirmed");
  return (await response.json()) as { timer: TimerRow; timers: TimerRow[] };
}
const unavailable = () => ({
  ok: false as const,
  error: {
    code: "NOT_CONFIGURED" as const,
    message: "Use the Smart Life connection in Devices.",
  },
});
export const tuyaSharing: TimerAdapter = {
  id: "tuya-sharing",
  kind: "cloud",
  discover: async () => unavailable(),
  pair: async () => unavailable(),
  read: async () => unavailable(),
  powerTimers: {
    async create(deviceId, power, seconds, signal) {
      if (deviceId !== "tuya-dehumidifier") return unavailable();
      try {
        const result = await timers(signal, {
          operation: "create",
          id: commandId(),
          deviceId,
          action: power ? "on" : "off",
          seconds,
        });
        return { ok: true, value: timerValue(result.timer) };
      } catch {
        return {
          ok: false,
          error: {
            code: "UNAVAILABLE",
            message: "Timer outcome unknown. Refresh timers before retrying.",
          },
        };
      }
    },
    async list(deviceId, signal) {
      if (deviceId !== "tuya-dehumidifier") return unavailable();
      try {
        const result = await timers(signal);
        return {
          ok: true,
          value: result.timers
            .filter((t) => t.deviceId === deviceId)
            .map(timerValue),
        };
      } catch {
        return {
          ok: false,
          error: { code: "UNAVAILABLE", message: "Timer status unavailable." },
        };
      }
    },
    async cancel(deviceId, id, signal) {
      if (deviceId !== "tuya-dehumidifier") return unavailable();
      try {
        await timers(signal, { operation: "cancel", id });
        return { ok: true, value: undefined };
      } catch {
        return {
          ok: false,
          error: {
            code: "UNAVAILABLE",
            message:
              "Cancellation not confirmed. Refresh timers; the command may already have been dispatched.",
          },
        };
      }
    },
  },
  async execute(deviceId, command, signal) {
    if (
      deviceId !== "tuya-dehumidifier" ||
      command.capability !== "power" ||
      typeof command.value !== "boolean"
    )
      return unavailable();
    try {
      const result = await tuyaRequest<{ acknowledged: boolean }>(
        "/action",
        {
          action: command.value ? "on" : "off",
          requestId: commandId(),
        },
        signal,
      );
      window.dispatchEvent(new Event("talin-device-changed"));
      return result.acknowledged
        ? { ok: true, value: undefined }
        : {
            ok: false,
            error: {
              code: "UNAVAILABLE",
              message:
                "No acknowledgement. The appliance may have received the command; check its state before retrying.",
            },
          };
    } catch {
      return {
        ok: false,
        error: {
          code: "UNAVAILABLE",
          message:
            "Connection interrupted. The appliance may have received the command; refresh before retrying.",
        },
      };
    }
  },
};
