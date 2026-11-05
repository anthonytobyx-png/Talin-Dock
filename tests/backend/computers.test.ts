import { describe, expect, it } from "vitest";
import { computerCommand, computerSnapshot } from "../../server/computers";
const now = Date.now();
const snapshot = {
  sampledAt: new Date(now).toISOString(),
  cpuPercent: 12,
  memoryUsedMb: 1000,
  memoryTotalMb: 32000,
  gpu: null,
  audio: {
    volume: 50,
    muted: false,
    output: "Test output",
    microphoneMuted: null,
    sessions: [
      { id: "session-fixture", name: "Test app", volume: 80, muted: false },
    ],
  },
  capabilities: ["masterVolume", "sessionVolume", "masterMute"],
};
describe("computer report and command boundary", () => {
  it("keeps measured values and drops unapproved fields", () => {
    const value = computerSnapshot(
      {
        ...snapshot,
        password: "private-fixture",
        windowTitle: "not collected",
      },
      now,
    );
    expect(value?.cpuPercent).toBe(12);
    expect(JSON.stringify(value)).not.toContain("private-fixture");
    expect(value).not.toHaveProperty("windowTitle");
  });
  it("rejects old/future samples, impossible metrics and unknown capabilities", () => {
    for (const patch of [
      { sampledAt: new Date(now - 61000).toISOString() },
      { sampledAt: new Date(now + 61000).toISOString() },
      { cpuPercent: 101 },
      { memoryUsedMb: 33000 },
      { capabilities: ["shell"] },
    ])
      expect(computerSnapshot({ ...snapshot, ...patch }, now)).toBeNull();
  });
  it("only permits advertised bounded controls and current audio sessions", () => {
    const value = computerSnapshot(snapshot, now)!;
    expect(
      computerCommand(
        { action: "masterVolume", value: 51, executable: "ignored" },
        value,
      ),
    ).toEqual({ action: "masterVolume", value: 51 });
    expect(
      computerCommand({ action: "masterVolume", value: 101 }, value),
    ).toBeNull();
    expect(
      computerCommand({ action: "masterVolume", value: 1.1 }, value),
    ).toBeNull();
    expect(
      computerCommand(
        { action: "sessionVolume", value: 30, sessionId: "another-session" },
        value,
      ),
    ).toBeNull();
    expect(
      computerCommand(
        { action: "sessionVolume", value: 30, sessionId: "session-fixture" },
        value,
      ),
    ).toEqual({
      action: "sessionVolume",
      value: 30,
      sessionId: "session-fixture",
    });
    expect(
      computerCommand({ action: "shell", value: "anything" }, value),
    ).toBeNull();
    expect(
      computerCommand({ action: "microphoneMute", value: false }, value),
    ).toBeNull();
  });
});
