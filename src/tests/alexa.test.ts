import { expect, it, vi } from "vitest";
import { readAlexaActions, triggerAlexa } from "../../server/alexa";
const trigger = "00000000-0000-4000-8000-000000000001";
const token = "00000000-0000-4000-8000-000000000002";
it("only exposes individually verified, valid, allowlisted actions", () => {
  expect(readAlexaActions("bad")).toEqual({});
  expect(
    readAlexaActions(
      JSON.stringify({
        "samsung-tv": {
          on: { trigger, token },
          off: { trigger, token, verified: true },
        },
        "unknown-device": { on: { trigger, token, verified: true } },
        "tuya-dehumidifier": {
          on: { trigger: "https://evil.example", token, verified: true },
        },
      }),
    ),
  ).toEqual({ "samsung-tv": { off: { trigger, token } } });
});
it("does not mistake HTTP success or another trigger for acknowledgement", async () => {
  for (const payload of [
    {},
    {
      URLRoutineTrigger: {
        triggerId: trigger,
        triggerActivationStatus: "failure",
      },
    },
    {
      URLRoutineTrigger: {
        triggerId: token,
        triggerActivationStatus: "success",
      },
    },
  ]) {
    const request = vi.fn().mockResolvedValue(Response.json(payload));
    expect(await triggerAlexa({ trigger, token }, request)).toBe(false);
    expect(request).toHaveBeenCalledOnce();
  }
});
it("accepts only a matching explicit acknowledgement and uses a fixed HTTPS destination", async () => {
  const request = vi.fn().mockResolvedValue(
    Response.json({
      URLRoutineTrigger: {
        triggerId: trigger,
        triggerActivationStatus: "success",
      },
    }),
  );
  expect(await triggerAlexa({ trigger, token }, request)).toBe(true);
  const [url, options] = request.mock.calls[0];
  expect(url.origin).toBe("https://www.virtualsmarthome.xyz");
  expect(url.pathname).toBe("/url_routine_trigger/activate.php");
  expect(options.redirect).toBe("manual");
});
it("fails closed on provider errors without retries or propagating credential errors", async () => {
  const request = vi.fn().mockRejectedValue(new Error("test-only private URL"));
  expect(await triggerAlexa({ trigger, token }, request)).toBe(false);
  expect(request).toHaveBeenCalledOnce();
});
