import type { IntegrationAdapter } from "./contracts";
import type { Device } from "../devices/model";
// Explicit, deterministic fixture. Never registered in the live application.
export function demoAdapter(): IntegrationAdapter {
  const fixture: Device = {
    id: "demo-sensor",
    name: "Demonstration sensor",
    type: "sensor",
    room: "Bedroom",
    adapterId: "demo",
    status: "online",
    access: "read-only",
    confirmedCapabilities: ["humidity"],
    hiddenCapabilities: [],
    updatedAt: new Date().toISOString(),
    readings: { humidity: 55 },
  };
  return {
    id: "demo",
    kind: "demo",
    discover: async () => ({ ok: true, value: [fixture] }),
    pair: async () => ({ ok: true, value: fixture }),
    read: async () => ({ ok: true, value: fixture }),
    execute: async () => ({
      ok: false,
      error: {
        code: "UNSUPPORTED",
        message: "Read-only demonstration fixture",
      },
    }),
  };
}
