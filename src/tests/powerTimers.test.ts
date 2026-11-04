import { describe, it, expect, vi } from "vitest";
import { devices, type Device } from "../devices/model";
import { sendCommand } from "../integrations/contracts";
import {
  addPowerTimer,
  readPowerTimers,
  cancelPowerTimer,
  type TimerAdapter,
  type PowerTimer,
} from "../integrations/powerTimers";
function fixture() {
  const device: Device = {
    ...devices[1],
    id: "test-future-plug",
    type: "plug",
    adapterId: "test-only",
    access: "controllable",
    status: "online",
    updatedAt: new Date().toISOString(),
    confirmedCapabilities: ["power", "powerTimer"],
    powerTimer: { executor: "device", minSeconds: 60, maxSeconds: 3600 },
  };
  const receipt: PowerTimer = {
    id: "test-timer",
    power: false,
    dueAt: new Date(Date.now() + 600000).toISOString(),
    executor: "device",
  };
  const adapter: TimerAdapter = {
    id: "test-only",
    kind: "demo",
    discover: vi.fn(),
    pair: vi.fn(),
    read: vi.fn(),
    execute: vi.fn(async () => ({ ok: true as const, value: undefined })),
    powerTimers: {
      create: vi.fn(async () => ({ ok: true as const, value: receipt })),
      list: vi.fn(async () => ({ ok: true as const, value: [receipt] })),
      cancel: vi.fn(async () => ({ ok: true as const, value: undefined })),
    },
  };
  return { device, adapter, receipt };
}
describe("power and durable countdown boundaries", () => {
  it("supports future device types through the same power and timer contract", async () => {
    const { device, adapter, receipt } = fixture();
    expect(
      await sendCommand(adapter, device, { capability: "power", value: true }),
    ).toMatchObject({ ok: true });
    expect(await addPowerTimer(adapter, device, false, 600)).toEqual({
      ok: true as const,
      value: receipt,
    });
    expect(adapter.powerTimers!.create).toHaveBeenCalledWith(
      device.id,
      false,
      600,
      expect.any(AbortSignal),
    );
    expect(await readPowerTimers(adapter, device)).toEqual({
      ok: true as const,
      value: [receipt],
    });
    expect(await cancelPowerTimer(adapter, device, receipt.id)).toMatchObject({
      ok: true as const,
    });
  });
  it("never schedules for unconfigured, stale, mismatched, read-only or hidden devices", async () => {
    for (const patch of [
      { status: "unconfigured" as const },
      { status: "offline" as const },
      { updatedAt: null },
      { adapterId: "other" },
      { access: "read-only" as const },
      { confirmedCapabilities: ["power"] as Device["confirmedCapabilities"] },
      { hiddenCapabilities: ["powerTimer"] as Device["hiddenCapabilities"] },
      { powerTimer: undefined },
    ]) {
      const { device, adapter } = fixture();
      expect(
        (await addPowerTimer(adapter, { ...device, ...patch }, false, 600)).ok,
      ).toBe(false);
      expect(adapter.powerTimers!.create).not.toHaveBeenCalled();
    }
  });
  it("does not substitute a browser timeout when a scheduling route is missing", async () => {
    const { device, adapter } = fixture();
    delete adapter.powerTimers;
    expect((await addPowerTimer(adapter, device, false, 600)).ok).toBe(false);
    expect(adapter.execute).not.toHaveBeenCalled();
  });
  it("rejects invalid durations and power payloads before transmission", async () => {
    const { device, adapter } = fixture();
    for (const seconds of [0, -1, NaN, Infinity, 59, 3601, 60.5])
      expect((await addPowerTimer(adapter, device, false, seconds)).ok).toBe(
        false,
      );
    expect(adapter.powerTimers!.create).not.toHaveBeenCalled();
    expect(
      (
        await sendCommand(adapter, device, {
          capability: "power",
          value: "off",
        })
      ).ok,
    ).toBe(false);
    expect(
      (
        await sendCommand(adapter, device, {
          capability: "powerTimer",
          value: 600,
        })
      ).ok,
    ).toBe(false);
    expect(adapter.execute).not.toHaveBeenCalled();
  });
  it("rejects inconsistent, past or malformed schedule receipts", async () => {
    for (const patch of [
      { id: "" },
      { power: true },
      { dueAt: "invalid" },
      { dueAt: new Date(0).toISOString() },
      { dueAt: new Date(Date.now() + 86400000).toISOString() },
      { executor: "service" as const },
    ]) {
      const { device, adapter, receipt } = fixture();
      adapter.powerTimers!.create = vi.fn(async () => ({
        ok: true as const,
        value: { ...receipt, ...patch },
      }));
      expect(await addPowerTimer(adapter, device, false, 600)).toMatchObject({
        ok: false,
        error: { code: "UNAVAILABLE" },
      });
    }
  });
  it("bounds an unresponsive scheduler without retrying or claiming failure to execute", async () => {
    vi.useFakeTimers();
    try {
      const { device, adapter } = fixture();
      adapter.powerTimers!.create = vi.fn(
        () =>
          new Promise<import("../integrations/contracts").Result<PowerTimer>>(
            () => {},
          ),
      );
      const pending = addPowerTimer(adapter, device, false, 600);
      await vi.advanceTimersByTimeAsync(5000);
      expect(await pending).toMatchObject({
        ok: false,
        error: { code: "TIMEOUT" },
      });
      expect(adapter.powerTimers!.create).toHaveBeenCalledTimes(1);
      const signal = vi.mocked(adapter.powerTimers!.create).mock.calls[0][3];
      expect(signal.aborted).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
  it("validates refreshed schedules and cancellation access", async () => {
    const { device, adapter, receipt } = fixture();
    adapter.powerTimers!.list = vi.fn(async () => ({
      ok: true as const,
      value: [{ ...receipt, dueAt: "bad" }],
    }));
    expect((await readPowerTimers(adapter, device)).ok).toBe(false);
    expect(
      (
        await cancelPowerTimer(
          adapter,
          { ...device, access: "read-only" },
          receipt.id,
        )
      ).ok,
    ).toBe(false);
    expect((await cancelPowerTimer(adapter, device, "")).ok).toBe(false);
    expect(adapter.powerTimers!.cancel).not.toHaveBeenCalled();
  });
});
