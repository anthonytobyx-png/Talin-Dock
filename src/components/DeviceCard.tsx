import { Droplets, Tv } from "lucide-react";
import { type Device, sensorValue } from "../devices/model";
import { Panel, Go } from "./primitives";
export function DeviceCard({
  device,
  large = false,
}: {
  device: Device;
  large?: boolean;
}) {
  const humidity = sensorValue(device, "humidity");
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
          <span>No TV connected</span>
        </div>
      )}
      <div className="device-footer">
        <span className="badge">
          {device.status === "unconfigured" ? "Not configured" : device.status}
        </span>
        {device.type === "tv" ? (
          <Go to="Remote">Remote</Go>
        ) : (
          <Go to="Devices">Details</Go>
        )}
      </div>
      {humidity?.stale && <p>Stale reading · updated {device.updatedAt}</p>}
      {large && (
        <p>
          Humidity, power and timers require a verified connection and support
          from this device. Unavailable actions stay disabled.
        </p>
      )}
    </Panel>
  );
}
