import { useState } from "react";
import { useSamsung } from "../data/SamsungContext";
import { Panel } from "./primitives";
import { TuyaConnection } from "./TuyaConnection";

export function HouseholdConnections() {
  const hub = useSamsung();
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
    </Panel>
  );
}
