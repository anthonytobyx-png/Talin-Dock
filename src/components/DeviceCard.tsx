import { useCallback, useState } from "react";
import { Droplets, Tv, Plug } from "lucide-react";
import { isFresh, type Device } from "../devices/model";
import { useSamsung } from "../data/SamsungContext";
import { Modal } from "./primitives";
import { SamsungLocalConnection } from "./SamsungLocalConnection";
import { DehumidifierControls } from "./DehumidifierControls";
export function DeviceCard({ device }: { device: Device }) {
  const hub = useSamsung();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const status =
    device.type === "tv"
      ? !hub.ready
        ? hub.snapshot
          ? "Unavailable"
          : "Not connected"
        : hub.snapshot?.reportedPower === "on"
          ? "On"
          : hub.snapshot?.reportedPower === "off"
            ? "Off"
            : "Status unknown"
      : device.status === "unconfigured"
        ? "Not connected"
        : device.status !== "online"
          ? device.status === "offline"
            ? "Offline"
            : "Unavailable"
          : !isFresh(device)
            ? "Status unavailable"
            : device.powerState === true
              ? "On"
              : device.powerState === false
                ? "Off"
                : "Online";
  const Icon =
    device.type === "tv"
      ? Tv
      : device.type === "dehumidifier"
        ? Droplets
        : Plug;
  return (
    <>
      <button
        className="device-tile"
        aria-label={`Open ${device.name} controls`}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <span className="device-tile-icon">
          <Icon size={32} aria-hidden="true" />
        </span>
        <strong>{device.name}</strong>
        <span className="device-tile-status">{status}</span>
      </button>
      {open && (
        <Modal title={device.name} close={close}>
          {device.type === "tv" ? (
            <SamsungLocalConnection />
          ) : device.type === "dehumidifier" ? (
            <DehumidifierControls device={device} />
          ) : (
            <p>No controls available.</p>
          )}
        </Modal>
      )}
    </>
  );
}
