import type { WeatherLocation } from "../state/model";
import type { Weather, Resource } from "./resources";
const MAX_AGE = 60 * 60 * 1000;
export const weatherKey = (location: WeatherLocation) =>
  `talin-dock.weather.${location.latitude.toFixed(3)},${location.longitude.toFixed(3)}`;
export function condition(code: number): string {
  if (code === 0) return "Clear skies";
  if (code <= 3) return "Cloudy";
  if (code === 45 || code === 48) return "Fog";
  if (code >= 51 && code <= 67) return "Rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return "Rain showers";
  if (code >= 85 && code <= 86) return "Snow showers";
  if (code >= 95) return "Thunderstorms";
  return "Conditions unavailable";
}
export function parseWeather(raw: unknown, location: WeatherLocation): Weather {
  const data = raw as {
    current?: { temperature_2m?: number; weather_code?: number };
    daily?: {
      time?: string[];
      temperature_2m_max?: number[];
      temperature_2m_min?: number[];
    };
  };
  if (
    !Number.isFinite(data.current?.temperature_2m) ||
    !Number.isFinite(data.current?.weather_code) ||
    !Array.isArray(data.daily?.time) ||
    data.daily.time.length < 5
  )
    throw new Error("Invalid forecast");
  const daily = data.daily!;
  const forecast = daily.time!.slice(0, 5).map((date, index) => {
    const high = daily.temperature_2m_max?.[index],
      low = daily.temperature_2m_min?.[index];
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(high) ||
      !Number.isFinite(low)
    )
      throw new Error("Invalid forecast");
    return { date, high: Math.round(high!), low: Math.round(low!) };
  });
  return {
    location: location.name,
    temperature: Math.round(data.current!.temperature_2m!),
    condition: condition(data.current!.weather_code!),
    forecast,
  };
}
export function cachedWeather(
  location: WeatherLocation,
  now = Date.now(),
): Resource<Weather> | null {
  try {
    const cached = JSON.parse(
      localStorage.getItem(weatherKey(location)) || "null",
    );
    if (
      cached?.status !== "ready" ||
      !Number.isFinite(Date.parse(cached.updatedAt)) ||
      Date.parse(cached.updatedAt) > now ||
      !Number.isFinite(cached.data?.temperature) ||
      typeof cached.data?.condition !== "string" ||
      !Array.isArray(cached.data?.forecast) ||
      !cached.data.forecast.every(
        (d: { date: unknown; high: unknown; low: unknown }) =>
          typeof d.date === "string" &&
          Number.isFinite(d.high) &&
          Number.isFinite(d.low),
      )
    )
      return null;
    return {
      ...cached,
      data: { ...cached.data, location: location.name },
      stale: now - Date.parse(cached.updatedAt) > MAX_AGE,
    };
  } catch {
    return null;
  }
}
export async function getForecast(
  location: WeatherLocation,
  signal: AbortSignal,
): Promise<Resource<Weather>> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener("abort", abort, { once: true });
  if (signal.aborted) controller.abort();
  const timer = setTimeout(abort, 8000);
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.search = new URLSearchParams({
      latitude: String(location.latitude),
      longitude: String(location.longitude),
      current: "temperature_2m,weather_code",
      daily: "temperature_2m_max,temperature_2m_min",
      timezone: "auto",
      forecast_days: "5",
    }).toString();
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error("Weather unavailable");
    const data = parseWeather(await response.json(), location);
    const resource: Resource<Weather> = {
      status: "ready",
      data,
      updatedAt: new Date().toISOString(),
      stale: false,
    };
    try {
      localStorage.setItem(weatherKey(location), JSON.stringify(resource));
    } catch {
      /* Weather still works if cache is blocked. */
    }
    return resource;
  } catch {
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    const cached = cachedWeather(location);
    return cached?.status === "ready"
      ? { ...cached, stale: true }
      : {
          status: "unavailable",
          message:
            "Forecast could not be reached. Please check your connection.",
        };
  } finally {
    clearTimeout(timer);
    signal.removeEventListener("abort", abort);
  }
}
export async function searchLocations(
  query: string,
  signal: AbortSignal,
): Promise<WeatherLocation[]> {
  if (query.trim().length < 2) return [];
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.search = new URLSearchParams({
    name: query.trim().slice(0, 100),
    count: "5",
    language: "en",
    format: "json",
  }).toString();
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error("Location search is unavailable");
  const data = await response.json();
  return (Array.isArray(data.results) ? data.results : [])
    .filter(
      (r: { latitude: unknown; longitude: unknown; name: unknown }) =>
        typeof r.name === "string" &&
        Number.isFinite(r.latitude) &&
        Number.isFinite(r.longitude),
    )
    .map(
      (r: {
        name: string;
        country?: string;
        latitude: number;
        longitude: number;
      }) => ({
        name: `${r.name}${r.country ? ", " + r.country : ""}`,
        latitude: r.latitude,
        longitude: r.longitude,
      }),
    );
}
