import { useState } from "react";
import { useSamsung } from "../data/SamsungContext";
import { Panel } from "./primitives";
export function SamsungLocalConnection() {
  const hub = useSamsung(),
    [message, setMessage] = useState(""),
    [minutes, setMinutes] = useState("30"),
    [action, setAction] = useState("off");
  const seconds = Number(minutes) * 60;
  async function send(
    path: string,
    data: Record<string, unknown>,
    success: string,
  ) {
    setMessage(
      (await hub.perform(path, data))
        ? success
        : "No result confirmed. Refresh TV status before retrying.",
    );
  }
  return (
    <section aria-label="Samsung TV power and timers">
      <Panel title="TV controls">
        <p>
          Reported power:{" "}
          <strong>{hub.snapshot?.reportedPower || "Unknown"}</strong>
          {hub.snapshot?.reportedAt
            ? ` · received ${new Date(hub.snapshot.reportedAt * 1000).toLocaleString()}`
            : ""}
          . Measurement time unavailable.
        </p>
        <div className="button-row">
          {["on", "off"].map((power) => (
            <button
              key={power}
              disabled={!hub.ready || hub.busy}
              onClick={() =>
                void send(
                  "/v1/power",
                  { action: power },
                  `Turn ${power} request accepted by the hub. Check the TV's reported state separately.`,
                )
              }
            >
              Turn {power}
            </button>
          ))}
          <button
            disabled={!hub.ready || hub.busy}
            onClick={() =>
              void send(
                "/v1/power",
                { action: "status" },
                "TV status requested. Refresh after a moment to read its response.",
              )
            }
          >
            Request TV status
          </button>
        </div>
        <h3>TV timer</h3>
        <p>Runs with Talin closed. Internet and the TV hub are required.</p>
        <label className="field">
          TV timer action
          <select
            value={action}
            disabled={hub.busy}
            onChange={(e) => setAction(e.target.value)}
          >
            <option value="off">Turn off</option>
            <option value="on">Turn on</option>
          </select>
        </label>
        <label className="field">
          TV countdown (minutes)
          <input
            type="number"
            min="1"
            max="1440"
            step="1"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
          />
        </label>
        <button
          disabled={
            !hub.ready ||
            hub.busy ||
            !Number.isInteger(seconds) ||
            seconds < 60 ||
            seconds > 86400
          }
          onClick={() =>
            void send(
              "/v1/timers",
              { action, seconds },
              "Timer saved on the hub. Its schedule is not proof of execution.",
            )
          }
        >
          Add TV timer
        </button>
        <ul>
          {hub.snapshot?.timers.map((timer) => (
            <li key={timer.id}>
              Turn {timer.action} ·{" "}
              {new Date(timer.dueAt * 1000).toLocaleString()} ·{" "}
              {timer.status === "sent"
                ? "Sent to SmartThings; physical result unconfirmed"
                : timer.status}
              {timer.status === "pending" && (
                <button
                  disabled={!hub.ready || hub.busy}
                  onClick={() =>
                    void send(
                      "/v1/timers/cancel",
                      { timerId: timer.id },
                      "Timer cancelled before dispatch.",
                    )
                  }
                >
                  Cancel TV timer
                </button>
              )}
            </li>
          ))}
        </ul>
        <p role="status">{message}</p>
        {!hub.ready && (
          <p role="alert">
            {navigator.onLine
              ? "TV unavailable. Check Settings if the connection needs attention."
              : "Offline. Previous reports are stale; controls are unavailable."}
          </p>
        )}
        <button disabled={hub.busy} onClick={() => void hub.refresh()}>
          Refresh TV status
        </button>
      </Panel>
    </section>
  );
}
