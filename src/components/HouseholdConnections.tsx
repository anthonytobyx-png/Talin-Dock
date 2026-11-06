import { useState } from "react";
import { useSamsung } from "../data/SamsungContext";
import { Panel } from "./primitives";
import { TuyaConnection } from "./TuyaConnection";
import { ComputerSettings } from "./ComputerSettings";
import { useDevices } from "../data/TuyaContext";

export function HouseholdConnections() {
  const hub = useSamsung();
  const devices = useDevices();
  const [address, setAddress] = useState(hub.endpoint);
  const [message, setMessage] = useState("");
  return (
    <Panel title="Household connections">
      <p>
        Sign in to the household once to use its saved cloud connections.
        Widgets share those connections and do not need separate passwords.
        Provider permission is granted during setup, rather than each time a
        widget is used.
      </p>
      <TuyaConnection />
      <ComputerSettings />
      <h3>Home device connection</h3>
      <p>
        {hub.ready
          ? "Secure TV hub reachable."
          : "TV hub enrollment pending on this device."}{" "}
        The iPad’s one-time device enrollment will be completed after the web
        connections are ready. No certificate or password is requested by
        individual TV widgets.
      </p>
      <details>
        <summary>Advanced TV hub address</summary>
        <p>
          After a hub restart, its local port may change. This address is a
          connection preference, not a password.
        </p>
        <label className="field">
          TV hub HTTPS address
          <input
            type="url"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            autoCapitalize="none"
            spellCheck={false}
          />
        </label>
        <button
          disabled={hub.busy}
          onClick={() =>
            setMessage(
              hub.configure(address)
                ? "Hub address saved. Refresh to verify the connection."
                : "Use the verified TV hub HTTPS address and port.",
            )
          }
        >
          Save TV hub address
        </button>
        <button disabled={hub.busy} onClick={() => void hub.refresh()}>
          Refresh TV hub connection
        </button>
        <p role="status">{message}</p>
      </details>
      <details>
        <summary>Device diagnostics</summary>
        {devices.map((device) => (
          <section key={device.id}>
            <h3>{device.name}</h3>
            <p>{device.model}</p>
            <p>
              {device.type === "tv"
                ? hub.ready
                  ? "Secure TV hub reachable"
                  : "TV hub unavailable"
                : device.status}
            </p>
            <p>
              Capabilities:{" "}
              {device.type === "tv"
                ? "Power and hub timers. Volume, inputs and app launching are unavailable."
                : device.confirmedCapabilities.join(", ") || "None verified"}
            </p>
            {device.updatedAt && (
              <p>
                Last retrieved: {new Date(device.updatedAt).toLocaleString()}
              </p>
            )}
            {device.error && <p>{device.error}</p>}
          </section>
        ))}
        {hub.error && <p role="alert">{hub.error}</p>}
        <p>
          TV sample time is unavailable. Its hub port may change after restart;
          abrupt power loss may lose recent timers. Provider acknowledgements
          are not physical confirmation.
        </p>
      </details>
    </Panel>
  );
}
