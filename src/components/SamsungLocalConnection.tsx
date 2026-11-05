import { useState } from "react";
import { useSamsung } from "../data/SamsungContext";
import { Panel, Go } from "./primitives";
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
        : "No result confirmed. Check the connection message before retrying.",
    );
  }
  return (
    <section aria-label="Samsung TV power and timers">
      <Panel title="Samsung TV · SmartThings local connection">
        <p>
          {hub.ready ? "Secure TV hub reachable" : "TV hub connection required"}{" "}
          · UE43U8000F
        </p>
        <p>
          SmartThings reported power:{" "}
          <strong>{hub.snapshot?.reportedPower || "Unknown"}</strong>
          {hub.snapshot?.reportedAt
            ? ` · received ${new Date(hub.snapshot.reportedAt * 1000).toLocaleString()}`
            : ""}
          . The underlying TV sample time is unavailable; this is not
          independent physical confirmation.
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
                "SmartThings status requested. Refresh after a moment to read its response.",
              )
            }
          >
            Request TV status
          </button>
        </div>
        <h3>TV timer</h3>
        <p>
          Runs on the TV hub with Talin closed and the PC off. Native
          SmartThings rules still need internet. A hub restart can change its
          connection port; abrupt power loss can lose recently saved timers.
        </p>
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
        {hub.error && <p role="alert">{hub.error}</p>}
        <Go to="Settings">Household connection settings</Go>
        <button disabled={hub.busy} onClick={() => void hub.refresh()}>
          Refresh TV hub status
        </button>
        <p>
          Only power and timers are configured. Volume, inputs and app launching
          remain unavailable.
        </p>
      </Panel>
    </section>
  );
}
