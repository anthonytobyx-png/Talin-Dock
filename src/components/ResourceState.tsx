import { useEffect, useState } from "react";
import { CalendarDays, CloudSun } from "lucide-react";
import {
  calendarProvider,
  weatherProvider,
  type Resource,
  type Weather,
  type CalendarEvent,
} from "../data/resources";
import { Go } from "./primitives";
export function ResourceState<T>({
  resource,
  unconfigured,
  children,
}: {
  resource: Resource<T>;
  unconfigured: string;
  children: (data: T) => React.ReactNode;
}) {
  switch (resource.status) {
    case "loading":
      return <p role="status">Loading…</p>;
    case "not-configured":
      return <p>{unconfigured}</p>;
    case "unavailable":
      return <p role="status">Unavailable · {resource.message}</p>;
    case "empty":
      return <p>Nothing to show.</p>;
    case "ready":
      return (
        <>
          {children(resource.data)}
          <small>
            {resource.stale ? "Stale · " : ""}Updated{" "}
            {new Date(resource.updatedAt).toLocaleString()}
          </small>
        </>
      );
  }
}
export function WeatherContent() {
  const [resource, setResource] = useState<Resource<Weather>>({
    status: "loading",
  });
  useEffect(() => {
    const controller = new AbortController();
    weatherProvider
      .read(controller.signal)
      .then(setResource)
      .catch(() =>
        setResource({
          status: "unavailable",
          message: "Weather service could not be reached.",
        }),
      );
    return () => controller.abort();
  }, []);
  return (
    <div className="resource-content">
      <CloudSun className="weather-icon" size={34} />
      <ResourceState
        resource={resource}
        unconfigured="Choose a weather provider and location to see your forecast."
      >
        {(data) => (
          <>
            <strong className="reading">{data.temperature}°</strong>
            <p>
              {data.location} · {data.condition}
            </p>
          </>
        )}
      </ResourceState>
      {resource.status === "not-configured" && (
        <span className="badge">Not configured</span>
      )}
      <Go to="Settings">Weather setup</Go>
    </div>
  );
}
export function CalendarContent({ week = false }: { week?: boolean }) {
  const [resource, setResource] = useState<Resource<CalendarEvent[]>>({
    status: "loading",
  });
  useEffect(() => {
    const controller = new AbortController();
    calendarProvider
      .read(controller.signal)
      .then(setResource)
      .catch(() =>
        setResource({
          status: "unavailable",
          message: "Calendar provider could not be reached.",
        }),
      );
    return () => controller.abort();
  }, []);
  return (
    <div className="calendar-content">
      {week ? (
        <div className="week-strip">
          {Array.from({ length: 7 }, (_, index) => {
            const day = new Date();
            day.setDate(day.getDate() + index);
            return (
              <div key={index} className={index === 0 ? "today" : ""}>
                <small>
                  {day.toLocaleDateString(undefined, { weekday: "short" })}
                </small>
                <strong>{day.getDate()}</strong>
              </div>
            );
          })}
        </div>
      ) : (
        <CalendarDays size={32} className="muted" />
      )}
      <ResourceState
        resource={resource}
        unconfigured="Your agenda belongs here. Connect a calendar provider in a future update."
      >
        {(events) => (
          <ul>
            {events.map((event) => (
              <li key={event.id}>{event.title}</li>
            ))}
          </ul>
        )}
      </ResourceState>
      <Go to="Calendars">Calendar setup</Go>
    </div>
  );
}
