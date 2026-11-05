import { Droplets, Tv } from "lucide-react";
import { type Device, sensorValue } from "../devices/model";
import { Panel, Go } from "./primitives";
import { useSamsung } from "../data/SamsungContext";
export function DeviceCard({
  device,
  large = false,
}: {
  device: Device;
  large?: boolean;
}) {
  const hub = useSamsung();
  const humidity =
    sensorValue(device, "humidity") ||
    (device.measurementTimeUnknown &&
    typeof device.readings.humidity === "number"
      ? { value: device.readings.humidity, stale: true }
      : null);
  return (
    <Panel
      title={device.name}
      className={large ? "large" : ""}
      action={
        <span className="device-icon">
          {device.type === "tv" ? <Tv size={21} /> : <Droplets size={21} />}
        </span>
      }
    >
      <span className="eyebrow">
        {device.room} · {device.type === "tv" ? "Entertainment" : "Climate"}
      </span>
      {device.type === "dehumidifier" ? (
        <div className="humidity-gauge">
          <div>
            <strong>{humidity ? `${humidity.value}%` : "—"}</strong>
            <span>Room humidity</span>
          </div>
        </div>
      ) : (
        <div className="tv-preview">
          <Tv size={40} />
          <span>
            {hub.snapshot
              ? `SmartThings reported: ${hub.snapshot.reportedPower}`
              : "TV hub not connected"}
          </span>
        </div>
      )}
      <div className="device-footer">
        <span className="badge">
          {device.type === "tv"
            ? hub.ready
              ? "Secure hub reachable"
              : "Hub unavailable"
            : device.status === "unconfigured"
              ? "Not configured"
              : device.status}
        </span>
        {device.type === "tv" ? (
          <Go to="Remote">Remote</Go>
        ) : (
          <Go to="Devices">Details</Go>
        )}
      </div>
      {humidity?.stale && <p>Stale reading · updated {device.updatedAt}</p>}
      {device.measurementTimeUnknown && humidity && (
        <p>
          Latest reported humidity · measurement time unavailable. Retrieved{" "}
          {device.updatedAt
            ? new Date(device.updatedAt).toLocaleString()
            : "Unknown"}{" "}
          from {device.dataSource}.
        </p>
      )}
      {large && device.status === "unconfigured" && (
        <p>
          Humidity, power and timers require a verified connection and support
          from this device. Unavailable actions stay disabled.
        </p>
      )}
    </Panel>
  );
}
