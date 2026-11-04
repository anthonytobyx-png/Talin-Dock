import type { IntegrationAdapter } from "./contracts";
const unavailable = async () => ({
  ok: false as const,
  error: {
    code: "NOT_CONFIGURED" as const,
    message:
      "Pairing and secure authentication are required. No hardware was contacted.",
  },
});
export const samsungLocal: IntegrationAdapter = {
  id: "samsung-local",
  kind: "local",
  discover: unavailable,
  pair: unavailable,
  read: unavailable,
  execute: unavailable,
};
export const tuyaCloud: IntegrationAdapter = {
  id: "tuya-cloud",
  kind: "cloud",
  discover: unavailable,
  pair: unavailable,
  read: unavailable,
  execute: unavailable,
};
