import { useState } from "react";
import { useSamsung } from "../data/SamsungContext";
import { Panel } from "./primitives";
export function SamsungLocalConnection() {
  const hub = useSamsung(),
    [address, setAddress] = useState(hub.endpoint),
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
        <details>
          <summary>TV connection setup</summary>
          <p>
            This connection needs the household's Talin server certificate and
            client identity installed on this iPad. Keys stay in the device
            keychain. Do not dismiss certificate warnings. If the hub restarts,
            read its new local-tls port from the Talin device in SmartThings and
            update the address below.
          </p>
          <p>
            One-time pairing:{" "}
            <a href="/talin-tv-root.cer">
              download the public Talin TV certificate
            </a>
            , review it in iPad Settings and install the separately supplied
            password-encrypted client identity. Certificate trust and identity
            installation require your approval on the iPad. Never send the
            identity password in chat.
          </p>
          <label className="field">
            TV hub HTTPS address
            <input
              type="url"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              autoCapitalize="none"
              spellCheck={false}
            />
          </label>
          <button
            disabled={hub.busy}
            onClick={() =>
              setMessage(
                hub.configure(address)
                  ? "Hub address saved on this device. Refresh to verify it."
                  : "Use https://192.168.1.3 followed by the hub's reported port.",
              )
            }
          >
            Save TV hub address
          </button>
        </details>
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
