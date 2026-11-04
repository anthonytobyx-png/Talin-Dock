import {
  canControl,
  type ControlCapability,
  type Device,
} from "../devices/model";
export type Result<T> =
  | { ok: true; value: T }
  | {
      ok: false;
      error: {
        code: "NOT_CONFIGURED" | "UNSUPPORTED" | "UNAVAILABLE" | "TIMEOUT";
        message: string;
      };
    };
export interface DeviceCommand {
  capability: ControlCapability;
  value: string | number | boolean;
}
export interface IntegrationAdapter {
  id: string;
  kind: "cloud" | "local" | "demo";
  discover(signal: AbortSignal): Promise<Result<Device[]>>;
  pair(deviceId: string, signal: AbortSignal): Promise<Result<Device>>;
  read(deviceId: string, signal: AbortSignal): Promise<Result<Device>>;
  execute(
    deviceId: string,
    command: DeviceCommand,
    signal: AbortSignal,
  ): Promise<Result<void>>;
}
export async function sendCommand(
  adapter: IntegrationAdapter,
  device: Device,
  command: DeviceCommand,
): Promise<Result<void>> {
  if (
    device.adapterId !== adapter.id ||
    !canControl(device, command.capability)
  )
    return {
      ok: false,
      error: {
        code: "UNSUPPORTED",
        message:
          "This device has not confirmed an available control capability.",
      },
    };
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      adapter.execute(device.id, command, controller.signal),
      new Promise<Result<void>>((resolve) => {
        timer = setTimeout(() => {
          controller.abort();
          resolve({
            ok: false,
            error: {
              code: "TIMEOUT",
              message: "The device did not acknowledge within 5 seconds.",
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
        message: "Integration unavailable. No action was confirmed.",
      },
    };
  } finally {
    clearTimeout(timer);
  }
}
