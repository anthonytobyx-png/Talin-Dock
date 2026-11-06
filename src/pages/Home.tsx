import { useEffect, useState } from "react";
import { useStore } from "../state/Store";
import { homeLayoutRoom, widgetNames, type Widget } from "../state/model";
import { useDevices } from "../data/TuyaContext";
import { Panel, Go } from "../components/primitives";
import { CalendarContent, WeatherContent } from "../components/ResourceState";
import { DeviceCard } from "../components/DeviceCard";
export function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return now;
}
export function Home() {
  const devices = useDevices();
  const { state } = useStore();
  const now = useClock();
  const profile = state.profiles[state.activeProfile];
  const widgets = state.household.layouts[homeLayoutRoom].filter(
    (w) => w !== "quick",
  );
  function renderWidget(widget: Widget) {
    if (widget === "tv" || widget === "dehumidifier") {
      const device = devices.find((d) => d.type === widget);
      return device ? <DeviceCard device={device} /> : null;
    }
    if (widget === "calendar" || widget === "week")
      return (
        <Panel
          title={widgetNames[widget]}
          className="wide"
          action={<Go to="Calendars">Open</Go>}
        >
          <CalendarContent week={widget === "week"} />
        </Panel>
      );
    if (widget === "weather")
      return (
        <Panel title="Weather" className="wide">
          <WeatherContent />
        </Panel>
      );
    if (widget === "humidity" || widget === "temperature") {
      const sensor =
        widget === "humidity"
          ? devices.find(
              (d) => d.dataSource && typeof d.readings.humidity === "number",
            )
          : undefined;
      return (
        <Panel title={widgetNames[widget]}>
          <strong className="reading">
            {sensor?.readings.humidity ?? "—"}
            <span>{widget === "humidity" ? "%" : "°"}</span>
          </strong>
          <p>
            {sensor
              ? `${sensor.status === "online" ? "Latest reported humidity" : "Stale reading"} · measurement time unavailable`
              : "No reading available"}
          </p>
          <Go to="Devices">View devices</Go>
        </Panel>
      );
    }
    if (widget === "media")
      return (
        <Panel title="Media" className="wide">
          <Go to="Media">Open media</Go>
        </Panel>
      );
    return null;
  }
  return (
    <>
      <header className="home-header">
        <div>
          <p className="date">
            {now.toLocaleDateString(undefined, {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
          <h1 className="clock">
            {now.toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
              hour12: !profile.hour24,
            })}
          </h1>
          <p className="room-summary">
            Your home <span>·</span> {devices.length} devices
          </p>
        </div>
        <div className="header-weather">
          <span className="eyebrow">OUTSIDE</span>
          <WeatherContent />
        </div>
      </header>
      <div className="widget-grid">
        {widgets.map((widget) => (
          <div
            className={`widget widget-${widget} size-${state.household.sizes[homeLayoutRoom][widget] || "small"}`}
            key={widget}
          >
            {renderWidget(widget)}
          </div>
        ))}
      </div>
      {!widgets.length && (
        <Panel title="Your dashboard">
          <p>Add widgets in Settings.</p>
        </Panel>
      )}
    </>
  );
}
