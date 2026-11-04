import { useEffect, useState } from "react";
import { Moon, Sun, Film, Power, SlidersHorizontal } from "lucide-react";
import { useStore } from "../state/Store";
import { rooms, widgetNames, type Widget } from "../state/model";
import { devices } from "../devices/model";
import { Panel, Go, Modal } from "../components/primitives";
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
  const { state, dispatch } = useStore();
  const now = useClock();
  const profile = state.profiles[state.activeProfile];
  const [editing, setEditing] = useState(false);
  const [ambient, setAmbient] = useState(false);
  const widgets = state.household.layouts[state.room];
  const count = devices.filter((d) => d.room === state.room).length;
  const time = now.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: !profile.hour24,
  });
  function toggle(widget: Widget) {
    dispatch({
      type: "layout",
      room: state.room,
      widgets: widgets.includes(widget)
        ? widgets.filter((w) => w !== widget)
        : [...widgets, widget],
    });
  }
  function renderWidget(widget: Widget) {
    if (widget === "tv") return <DeviceCard device={devices[0]} />;
    if (widget === "dehumidifier")
      return <DeviceCard device={devices[1]} large />;
    if (widget === "calendar" || widget === "week")
      return (
        <Panel
          title={widgetNames[widget]}
          className={widget === "calendar" ? "wide calendar-panel" : "wide"}
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
    if (widget === "humidity" || widget === "temperature")
      return (
        <Panel title={widgetNames[widget]}>
          <span className="eyebrow">{state.room}</span>
          <strong className="reading">
            —<span>{widget === "humidity" ? "%" : "°"}</span>
          </strong>
          <p>
            {state.room === "Bedroom" && widget === "humidity"
              ? "Sensor not configured"
              : "No confirmed sensor in this room"}
          </p>
          <Go to="Devices">View devices</Go>
        </Panel>
      );
    if (widget === "media")
      return (
        <Panel title="Media on iPad" className="wide">
          <p>Your favourites, one tap away.</p>
          <Go to="Media">Open media shortcuts</Go>
        </Panel>
      );
    return (
      <Panel title="Quick actions">
        <div className="quick-actions">
          <button onClick={() => setAmbient(true)}>
            <Moon size={18} />
            Ambient
          </button>
          <Go to="Remote">Remote</Go>
          <Go to="Voice">Talin Voice</Go>
        </div>
      </Panel>
    );
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
          <h1 className="clock">{time}</h1>
          <p className="room-summary">
            {state.room}
            <span>·</span>
            {count} {count === 1 ? "accessory" : "accessories"}
            <span>·</span>Ready to make it yours
          </p>
        </div>
        <div className="header-weather">
          <span className="eyebrow">OUTSIDE</span>
          <WeatherContent />
        </div>
      </header>
      <div className="room-toolbar">
        <div className="segments" aria-label="Rooms">
          {rooms.map((room) => (
            <button
              key={room}
              aria-pressed={room === state.room}
              onClick={() => dispatch({ type: "room", room })}
            >
              {room}
            </button>
          ))}
        </div>
        <button className="text-button" onClick={() => setEditing(!editing)}>
          <SlidersHorizontal size={16} />
          {editing ? "Done" : "Edit widgets"}
        </button>
      </div>
      <section className="scenes" aria-label="Scenes">
        {[
          [Sun, "Good morning"],
          [Film, "Movie time"],
          [Moon, "Good night"],
          [Power, "All off"],
        ].map(([Icon, label]) => {
          const SceneIcon = Icon as typeof Sun;
          return (
            <button
              key={String(label)}
              disabled
              title="Configure real device integrations before running scenes"
            >
              <SceneIcon size={18} />
              <span>
                {String(label)}
                <small>Not configured</small>
              </span>
            </button>
          );
        })}
      </section>
      {editing && (
        <Panel title={`Widgets in ${state.room}`} className="editor">
          <p>
            Shared by all profiles. Toggle widgets, then arrange them below.
            Order stays the same in both orientations.
          </p>
          <div className="widget-options">
            {(Object.keys(widgetNames) as Widget[]).map((widget) => (
              <label key={widget}>
                <input
                  type="checkbox"
                  checked={widgets.includes(widget)}
                  onChange={() => toggle(widget)}
                />
                {widgetNames[widget]}
              </label>
            ))}
          </div>
          <div className="layout-editor">
            {widgets.map((widget, index) => (
              <div className="layout-row" key={widget}>
                <strong>{widgetNames[widget]}</strong>
                <div className="button-row">
                  <button
                    aria-label={`Move ${widgetNames[widget]} earlier`}
                    disabled={index === 0}
                    onClick={() => {
                      const next = [...widgets];
                      [next[index - 1], next[index]] = [
                        next[index],
                        next[index - 1],
                      ];
                      dispatch({
                        type: "layout",
                        room: state.room,
                        widgets: next,
                      });
                    }}
                  >
                    ↑
                  </button>
                  <button
                    aria-label={`Move ${widgetNames[widget]} later`}
                    disabled={index === widgets.length - 1}
                    onClick={() => {
                      const next = [...widgets];
                      [next[index + 1], next[index]] = [
                        next[index],
                        next[index + 1],
                      ];
                      dispatch({
                        type: "layout",
                        room: state.room,
                        widgets: next,
                      });
                    }}
                  >
                    ↓
                  </button>
                  <label className="size-label">
                    Size
                    <select
                      aria-label={`${widgetNames[widget]} widget size`}
                      value={
                        state.household.sizes[state.room][widget] || "small"
                      }
                      onChange={(event) =>
                        dispatch({
                          type: "size",
                          room: state.room,
                          widget,
                          size: event.target.value as
                            "small" | "wide" | "large",
                        })
                      }
                    >
                      <option value="small">Small</option>
                      <option value="wide">Wide</option>
                      <option value="large">Large</option>
                    </select>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
      <div className="widget-grid">
        {widgets.map((widget) => (
          <div
            className={`widget widget-${widget} size-${state.household.sizes[state.room][widget] || "small"}`}
            key={widget}
          >
            {renderWidget(widget)}
          </div>
        ))}
      </div>
      {widgets.length === 0 && (
        <Panel title="A quiet room">
          <p>No widgets yet. Use Edit widgets to add your first one.</p>
        </Panel>
      )}
      <footer className="dashboard-footer">
        <span className="status-dot" />
        On this iPad · preferences stored locally
        <span>Devices awaiting setup</span>
      </footer>
      {ambient && (
        <Modal title="Ambient" close={() => setAmbient(false)}>
          <p className="date">
            {now.toLocaleDateString(undefined, { dateStyle: "full" })}
          </p>
          <div className="ambient-clock">{time}</div>
          <p>{state.room} · Devices awaiting setup</p>
          <button onClick={() => setAmbient(false)}>Return to dashboard</button>
        </Modal>
      )}
    </>
  );
}
