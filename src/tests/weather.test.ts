import { afterEach, describe, it, expect, vi } from "vitest";
import {
  condition,
  parseWeather,
  getForecast,
  cachedWeather,
  weatherKey,
} from "../data/weather";
import { defaults } from "../state/model";
const location = defaults().household.weatherLocation!;
const response = {
  current: { temperature_2m: 10.4, weather_code: 61 },
  daily: {
    time: [
      "2026-11-04",
      "2026-11-05",
      "2026-11-06",
      "2026-11-07",
      "2026-11-08",
    ],
    temperature_2m_max: [12, 13, 14, 12, 11],
    temperature_2m_min: [5, 6, 4, 3, 5],
  },
};
afterEach(() => {
  vi.unstubAllGlobals();
});
describe("weather", () => {
  it("parses forecast data and rejects incomplete responses", () => {
    expect(parseWeather(response, location)).toMatchObject({
      location: "Monaghan, Ireland",
      temperature: 10,
      condition: "Rain",
    });
    expect(parseWeather(response, location).forecast).toHaveLength(5);
    expect(() =>
      parseWeather({ current: { temperature_2m: 10 } }, location),
    ).toThrow();
    expect(condition(95)).toBe("Thunderstorms");
  });
  it("fetches a real-provider-shaped response and caches it without credentials", async () => {
    const values = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) || null,
      setItem: (key: string, value: string) => values.set(key, value),
    });
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      expect(String(input)).toContain("https://api.open-meteo.com/v1/forecast");
      return Response.json(response);
    });
    vi.stubGlobal("fetch", fetcher);
    const result = await getForecast(location, new AbortController().signal);
    expect(result.status).toBe("ready");
    expect(String(fetcher.mock.calls[0]?.[0])).toContain(
      "https://api.open-meteo.com/v1/forecast",
    );
    expect(cachedWeather(location)?.status).toBe("ready");
    expect(values.has(weatherKey(location))).toBe(true);
  });
  it("keeps cached weather visibly stale on network failure", async () => {
    vi.stubGlobal("localStorage", {
      getItem: () =>
        JSON.stringify({
          status: "ready",
          data: parseWeather(response, location),
          updatedAt: "2026-01-01T00:00:00Z",
          stale: false,
        }),
    });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(
      await getForecast(location, new AbortController().signal),
    ).toMatchObject({ status: "ready", stale: true });
  });
  it("shows unavailable when there is no valid cache", async () => {
    vi.stubGlobal("localStorage", { getItem: () => "{corrupt" });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(
      await getForecast(location, new AbortController().signal),
    ).toMatchObject({ status: "unavailable" });
  });
});
