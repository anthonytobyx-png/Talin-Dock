import type { Room } from "../state/model";
export type Capability =
  | "humidity"
  | "temperature"
  | "power"
  | "volume"
  | "source"
  | "apps"
  | "remote";
export type ControlCapability = Exclude<Capability, "humidity" | "temperature">;
export interface Device {
  id: string;
  name: string;
  type: "tv" | "dehumidifier" | "sensor" | "light" | "plug" | "ac" | "camera";
  room: Room;
  model?: string;
  adapterId: string;
  status: "unconfigured" | "online" | "offline" | "unavailable";
  access: "read-only" | "controllable";
  confirmedCapabilities: Capability[];
  hiddenCapabilities: Capability[];
  updatedAt: string | null;
  error?: string;
  readings: Partial<Record<"humidity" | "temperature", number>>;
}
export const devices: Device[] = [
  {
    id: "samsung-tv",
    name: "Samsung TV",
    type: "tv",
    room: "Desk",
    model: "UE43U8000F",
    adapterId: "samsung-local",
    status: "unconfigured",
    access: "controllable",
    confirmedCapabilities: [],
    hiddenCapabilities: [],
    updatedAt: null,
    readings: {},
  },
  {
    id: "tuya-dehumidifier",
    name: "Dehumidifier",
    type: "dehumidifier",
    room: "Bedroom",
    model: "Devology Virgo-RCS12(y)-N7-1 (DEV_19)",
    adapterId: "tuya-cloud",
    status: "unconfigured",
    access: "read-only",
    confirmedCapabilities: [],
    hiddenCapabilities: [],
    updatedAt: null,
    readings: {},
  },
];
export function isFresh(
  device: Device,
  now = Date.now(),
  maxAge = 5 * 60 * 1000,
): boolean {
  const stamp = device.updatedAt ? Date.parse(device.updatedAt) : NaN;
  return Number.isFinite(stamp) && now >= stamp && now - stamp <= maxAge;
}
export function canControl(
  device: Device,
  capability: ControlCapability,
  now = Date.now(),
): boolean {
  return (
    device.status === "online" &&
    device.access === "controllable" &&
    device.confirmedCapabilities.includes(capability) &&
    !device.hiddenCapabilities.includes(capability) &&
    isFresh(device, now)
  );
}
export function sensorValue(
  device: Device,
  capability: "humidity" | "temperature",
  now = Date.now(),
): { value: number; stale: boolean } | null {
  const value = device.readings[capability];
  if (
    device.status !== "online" ||
    !device.confirmedCapabilities.includes(capability) ||
    device.hiddenCapabilities.includes(capability) ||
    typeof value !== "number" ||
    !Number.isFinite(value)
  )
    return null;
  return { value, stale: !isFresh(device, now) };
}
