import { useState } from "react";
import { type Device, isFresh } from "../devices/model";
import { useTuya, tuyaRequest } from "../data/TuyaContext";
import { tuyaSharing } from "../integrations/tuyaSharing";
import { samsungLocal, tuyaCloud } from "../integrations/unconfigured";
import { commandId } from "../integrations/commandId";
import { DeviceControls } from "./DeviceControls";
export function DehumidifierControls({ device }: { device: Device }) {
  const connection = useTuya();
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const ready =
    device.status === "online" &&
    isFresh(device) &&
    !connection.error &&
    navigator.onLine;
  const nativeTimer = connection.state?.countdownOptions.includes("2h");
  const humidity =
    device.confirmedCapabilities.includes("humidity") &&
    !device.hiddenCapabilities.includes("humidity")
      ? device.readings.humidity
      : undefined;
  async function countdown(action: "2h" | "cancel") {
    if (!ready || busy) return;
    setBusy(true);
    try {
      const result = await tuyaRequest<{ acknowledged: boolean }>("/action", {
        action,
        requestId: commandId(),
      });
      setMessage(
        result.acknowledged
          ? "Device countdown request acknowledged. Check the latest timer reading."
          : "Countdown outcome unknown. Refresh before retrying.",
      );
      await connection.refresh();
    } catch {
      setMessage("Countdown outcome unknown. Refresh before retrying.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="device-controls-body">
      <div className="device-reading">
        <span>Humidity</span>
        <strong>{typeof humidity === "number" ? `${humidity}%` : "—"}</strong>
      </div>
      <p>
        {!ready && typeof humidity === "number" ? "Stale reading. " : ""}
        Latest reported humidity · measurement time unavailable.
      </p>
      <p className="reading-time">
        Retrieved{" "}
        {device.updatedAt
          ? new Date(device.updatedAt).toLocaleString()
          : "Not yet received"}
      </p>
      <p>
        Reported power:{" "}
        <strong>
          {device.powerState === true
            ? "On"
            : device.powerState === false
              ? "Off"
              : "Unknown"}
        </strong>
      </p>
      {!ready && (
        <p role="alert">
          {navigator.onLine
            ? "Device unavailable. Check Settings if the connection needs attention."
            : "Offline. Previous readings are stale; controls are unavailable."}
        </p>
      )}
      <button
        disabled={busy || connection.loading}
        onClick={() => void connection.refresh()}
      >
        Refresh device status
      </button>
      <DeviceControls
        device={device}
        adapter={[tuyaSharing, samsungLocal, tuyaCloud].find(
          (adapter) => adapter.id === device.adapterId,
        )}
      />
      {nativeTimer && (
        <section aria-label="Device countdown">
          <h3>Device countdown</h3>
          <p>
            {connection.state?.countdownLeft === null
              ? "Remaining time unavailable"
              : `${connection.state?.countdownLeft} minutes remaining`}
          </p>
          <div className="button-row">
            <button
              disabled={!ready || busy || device.powerState !== true}
              onClick={() => void countdown("2h")}
            >
              Set device 2-hour countdown
            </button>
            <button
              disabled={!ready || busy}
              onClick={() => void countdown("cancel")}
            >
              Cancel device countdown
            </button>
          </div>
          <p role="status">{message}</p>
        </section>
      )}
    </div>
  );
}
