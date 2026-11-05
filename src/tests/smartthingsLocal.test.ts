import { describe, expect, it } from "vitest";
import { hubSnapshot, tvEndpoint } from "../integrations/smartthingsLocal";
describe("authenticated local TV boundary", () => {
  it("allows only the verified HTTPS hub address without URL credentials or paths", () => {
    expect(tvEndpoint("https://192.168.1.3:42047")).toBe(
      "https://192.168.1.3:42047",
    );
    for (const value of [
      "http://192.168.1.3:42047",
      "https://evil.example:42047",
      "https://192.168.1.4:42047",
      "https://user:password@192.168.1.3:42047",
      "https://192.168.1.3:42047/control",
      "https://192.168.1.3:42047?token=x",
      "https://192.168.1.3:443",
    ])
      expect(tvEndpoint(value)).toBeNull();
  });
  it("retains unknown provider state and normalizes only the empty Lua sequence", () => {
    const value = hubSnapshot({
      version: 1,
      reportedPower: "unknown",
      reportedAt: 0,
      timers: {},
    });
    expect(value.reportedPower).toBe("unknown");
    expect(value.timers).toEqual([]);
    expect(() =>
      hubSnapshot({
        version: 1,
        reportedPower: "on",
        reportedAt: 1,
        timers: { hidden: "data" },
      }),
    ).toThrow();
  });
  it("rejects malformed timer outcomes and never upgrades a sent request into device confirmation", () => {
    const timer = {
      id: "timer-00000000001",
      action: "off",
      dueAt: 1793880000,
      status: "sent",
    };
    expect(
      hubSnapshot({
        version: 1,
        reportedPower: "off",
        reportedAt: 1,
        timers: [timer],
      }).timers[0].status,
    ).toBe("sent");
    expect(() =>
      hubSnapshot({
        version: 1,
        reportedPower: "off",
        reportedAt: 1,
        timers: [{ ...timer, status: "device-confirmed" }],
      }),
    ).toThrow();
  });
});
