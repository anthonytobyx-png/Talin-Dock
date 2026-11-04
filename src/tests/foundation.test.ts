import { describe, it, expect, vi } from "vitest";
import { defaults, reducer, sections } from "../state/model";
import { decode, localSettings, STORAGE_KEY } from "../state/storage";
import {
  devices,
  canControl,
  sensorValue,
  type Device,
} from "../devices/model";
import { sendCommand } from "../integrations/contracts";
import { demoAdapter } from "../integrations/demo";
const now = Date.parse("2026-11-04T12:00:00Z");
const online: Device = {
  ...devices[0],
  status: "online",
  confirmedCapabilities: ["power"],
  updatedAt: new Date(now).toISOString(),
};
describe("preferences and navigation", () => {
  it("round-trips profile, household layout and selected room independently", () => {
    let state = reducer(defaults(), { type: "room", room: "Bedroom" });
    state = reducer(state, { type: "profile", id: "barbara" });
    state = reducer(state, {
      type: "preferences",
      patch: { name: "Bia", hour24: false },
    });
    state = reducer(state, {
      type: "layout",
      room: "Bedroom",
      widgets: ["humidity"],
    });
    const restored = decode(JSON.stringify(state));
    expect(restored).toEqual(state);
    expect(restored.profiles.anthony.hour24).toBe(true);
    expect(restored.household.layouts.Bedroom).toEqual(["humidity"]);
  });
  it("preserves context through every section and changes mode correctly", () => {
    let state = reducer(defaults(), { type: "room", room: "Kitchen" });
    for (const section of sections) {
      state = reducer(state, { type: "navigate", section });
      expect(state.room).toBe("Kitchen");
      expect(state.household.layouts).toEqual(defaults().household.layouts);
    }
    expect(state.mode).toBe("computer");
    state = reducer(state, { type: "navigate", section: "Home" });
    expect(state.mode).toBe("home");
  });
  it("recovers corrupted or unknown storage and projects only safe keys", () => {
    for (const raw of ["bad", "null", '{"version":2}'])
      expect(decode(raw)).toEqual(defaults());
    const state = defaults();
    expect(
      decode(
        JSON.stringify({
          ...state,
          token: "secret",
          room: "Moon",
          household: { layouts: { Desk: ["__proto__"] } },
        }),
      ),
    ).toEqual(state);
  });
  it("handles denied storage and reports failed writes", () => {
    const storage = localSettings(() => {
      throw new Error("SecurityError");
    });
    expect(storage.load()).toEqual(defaults());
    expect(storage.save(defaults())).toBe(false);
  });
  it("writes and loads through a replaceable storage port", () => {
    const values = new Map<string, string>();
    const repo = localSettings(() => ({
      getItem: (k) => values.get(k) || null,
      setItem: (k, v) => {
        values.set(k, v);
      },
    }));
    const state = reducer(defaults(), { type: "profile", id: "anthony" });
    expect(repo.save(state)).toBe(true);
    expect(values.has(STORAGE_KEY)).toBe(true);
    expect(repo.load()).toEqual(state);
  });
});
describe("confirmed device capabilities", () => {
  it("never controls an unconfigured, offline, stale, read-only or hidden capability", () => {
    expect(canControl(online, "power", now)).toBe(true);
    for (const patch of [
      { status: "unconfigured" as const },
      { status: "offline" as const },
      { updatedAt: null },
      { access: "read-only" as const },
      { hiddenCapabilities: ["power"] as Device["hiddenCapabilities"] },
      { confirmedCapabilities: [] },
    ])
      expect(canControl({ ...online, ...patch }, "power", now)).toBe(false);
    expect(canControl(online, "volume", now)).toBe(false);
    expect(canControl(online, "power", now + 300001)).toBe(false);
  });
  it("does not display unconfirmed or offline sensor readings; flags old values", () => {
    const sensor: Device = {
      ...devices[1],
      status: "online",
      confirmedCapabilities: ["humidity"],
      readings: { humidity: 62 },
      updatedAt: new Date(now).toISOString(),
    };
    expect(sensorValue(sensor, "humidity", now)).toEqual({
      value: 62,
      stale: false,
    });
    expect(sensorValue(sensor, "humidity", now + 300001)?.stale).toBe(true);
    expect(
      sensorValue({ ...sensor, status: "offline" }, "humidity", now),
    ).toBeNull();
    expect(sensorValue(sensor, "temperature", now)).toBeNull();
  });
  it("rejects a command before contacting an adapter", async () => {
    const adapter = demoAdapter();
    adapter.execute = vi.fn(adapter.execute);
    const result = await sendCommand(adapter, devices[0], {
      capability: "power",
      value: true,
    });
    expect(result.ok).toBe(false);
    expect(adapter.execute).not.toHaveBeenCalled();
  });
  it("bounds an unresponsive adapter to five seconds", async () => {
    vi.useFakeTimers();
    const adapter = demoAdapter();
    adapter.execute = () => new Promise(() => {});
    const pending = sendCommand(
      adapter,
      { ...online, adapterId: "demo", updatedAt: new Date().toISOString() },
      { capability: "power", value: true },
    );
    await vi.advanceTimersByTimeAsync(5000);
    expect(await pending).toMatchObject({
      ok: false,
      error: { code: "TIMEOUT" },
    });
    vi.useRealTimers();
  });
});
