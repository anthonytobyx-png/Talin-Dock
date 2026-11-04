export type Resource<T> =
  | { status: "not-configured" }
  | { status: "loading" }
  | { status: "unavailable"; message: string }
  | { status: "empty" }
  | { status: "ready"; data: T; updatedAt: string; stale: boolean };
export interface Weather {
  location: string;
  temperature: number;
  condition: string;
  forecast: { date: string; high: number; low: number }[];
}
export interface CalendarEvent {
  id: string;
  calendarId: string;
  title: string;
  start: string;
  end: string;
  location?: string;
}
export interface WeatherProvider {
  read(signal: AbortSignal): Promise<Resource<Weather>>;
}
export interface CalendarProvider {
  read(signal: AbortSignal): Promise<Resource<CalendarEvent[]>>;
}
export const weatherProvider: WeatherProvider = {
  read: async () => ({ status: "not-configured" }),
};
export const calendarProvider: CalendarProvider = {
  read: async () => ({ status: "not-configured" }),
};
