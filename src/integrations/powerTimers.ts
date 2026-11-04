import { canControl, type Device } from "../devices/model";
import type { IntegrationAdapter, Result } from "./contracts";

export interface PowerTimer {
  id: string;
  power: boolean;
  dueAt: string;
  executor: "device" | "service";
}
export interface PowerTimerPort {
  create(
    deviceId: string,
    power: boolean,
    seconds: number,
    signal: AbortSignal,
  ): Promise<Result<PowerTimer>>;
  list(deviceId: string, signal: AbortSignal): Promise<Result<PowerTimer[]>>;
  cancel(
    deviceId: string,
    timerId: string,
    signal: AbortSignal,
  ): Promise<Result<void>>;
}
export type TimerAdapter = IntegrationAdapter & {
  powerTimers?: PowerTimerPort;
};
const denied = (message: string): Result<never> => ({
  ok: false,
  error: { code: "UNSUPPORTED", message },
});
export function canUsePowerTimers(
  device: Device,
  adapter: TimerAdapter,
): boolean {
  const limits = device.powerTimer;
  return (
    device.adapterId === adapter.id &&
    canControl(device, "power") &&
    canControl(device, "powerTimer") &&
    !!adapter.powerTimers &&
    !!limits &&
    ["device", "service"].includes(limits.executor) &&
    Number.isSafeInteger(limits.minSeconds) &&
    Number.isSafeInteger(limits.maxSeconds) &&
    limits.minSeconds >= 1 &&
    limits.maxSeconds >= limits.minSeconds
  );
}
async function bounded<T>(
  operation: (signal: AbortSignal) => Promise<Result<T>>,
): Promise<Result<T>> {
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation(controller.signal),
      new Promise<Result<T>>((resolve) => {
        timeout = setTimeout(() => {
          controller.abort();
          resolve({
            ok: false,
            error: {
              code: "TIMEOUT",
              message:
                "No timer acknowledgement. Refresh timers before retrying; the request may have reached the device.",
            },
          });
        }, 5000);
      }),
    ]);
  } catch {
    return {
      ok: false,
      error: {
        code: "UNAVAILABLE",
        message: "Timer status is unknown. Refresh timers before retrying.",
      },
    };
  } finally {
    clearTimeout(timeout);
  }
}
function validTimer(timer: PowerTimer, device: Device): boolean {
  return (
    !!timer &&
    typeof timer.id === "string" &&
    timer.id.length > 0 &&
    timer.id.length <= 200 &&
    typeof timer.power === "boolean" &&
    Number.isFinite(Date.parse(timer.dueAt)) &&
    timer.executor === device.powerTimer?.executor
  );
}
export async function addPowerTimer(
  adapter: TimerAdapter,
  device: Device,
  power: boolean,
  seconds: number,
): Promise<Result<PowerTimer>> {
  if (!canUsePowerTimers(device, adapter))
    return denied(
      "Connect the device and confirm power and durable timer support first.",
    );
  if (
    typeof power !== "boolean" ||
    !Number.isSafeInteger(seconds) ||
    seconds < device.powerTimer!.minSeconds ||
    seconds > device.powerTimer!.maxSeconds
  )
    return denied("Choose a supported countdown duration.");
  const requestedAt = Date.now();
  const result = await bounded((signal) =>
    adapter.powerTimers!.create(device.id, power, seconds, signal),
  );
  if (
    result.ok &&
    (!validTimer(result.value, device) ||
      result.value.power !== power ||
      Date.parse(result.value.dueAt) <= Date.now() ||
      Date.parse(result.value.dueAt) < requestedAt + seconds * 1000 - 30000 ||
      Date.parse(result.value.dueAt) > Date.now() + seconds * 1000 + 30000)
  )
    return {
      ok: false,
      error: {
        code: "UNAVAILABLE",
        message:
          "The timer receipt could not be verified. Refresh timers before retrying.",
      },
    };
  return result;
}
export async function readPowerTimers(
  adapter: TimerAdapter,
  device: Device,
): Promise<Result<PowerTimer[]>> {
  if (!canUsePowerTimers(device, adapter))
    return denied("Timer access is unavailable for this device.");
  const result = await bounded((signal) =>
    adapter.powerTimers!.list(device.id, signal),
  );
  if (
    result.ok &&
    (!Array.isArray(result.value) ||
      result.value.length > 100 ||
      !result.value.every((timer) => validTimer(timer, device)))
  )
    return {
      ok: false,
      error: {
        code: "UNAVAILABLE",
        message: "Timer status could not be verified.",
      },
    };
  return result;
}
export async function cancelPowerTimer(
  adapter: TimerAdapter,
  device: Device,
  id: string,
): Promise<Result<void>> {
  if (
    !canUsePowerTimers(device, adapter) ||
    typeof id !== "string" ||
    !id ||
    id.length > 200
  )
    return denied("Timer cancellation is unavailable.");
  return bounded((signal) =>
    adapter.powerTimers!.cancel(device.id, id, signal),
  );
}
