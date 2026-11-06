import { media } from "../data/media";
import { Monitor, Mic } from "lucide-react";
import { DeviceCard } from "../components/DeviceCard";
import { Panel } from "../components/primitives";
import { useDevices } from "../data/TuyaContext";
import { CalendarContent } from "../components/ResourceState";
import { SamsungLocalConnection } from "../components/SamsungLocalConnection";
export function Devices() {
  const devices = useDevices();
  return (
    <>
      <Intro
        eyebrow="YOUR CONNECTED HOME"
        title="Devices"
        description="Tap a device to use its controls."
      />
      <div className="device-grid">
        {devices.map((device) => (
          <DeviceCard key={device.id} device={device} />
        ))}
      </div>
    </>
  );
}
function Intro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="page-intro">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}
export function Remote() {
  return (
    <>
      <Intro
        eyebrow="ENTERTAINMENT"
        title="TV remote"
        description="Samsung TV"
      />
      <SamsungLocalConnection />
    </>
  );
}
export function Calendars() {
  return (
    <>
      <Intro
        eyebrow="A LITTLE MORE IN SYNC"
        title="Calendars"
        description="A shared view of your days, with privacy designed in."
      />
      <div className="two-columns">
        <Panel title="Your agenda">
          <CalendarContent />
        </Panel>
      </div>
    </>
  );
}
export function Media() {
  return (
    <>
      <Intro
        eyebrow="PICK SOMETHING GOOD"
        title="Media"
        description="Open your media services."
      />
      <p className="notice">
        These links open each service’s official website. iPadOS may hand off to
        an installed app; app detection and automatic fallback are unavailable
        in a web app. Return using the app switcher.
      </p>
      <div className="media-grid">
        {media.map((app) => (
          <Panel title={app.name} key={app.name}>
            <div className={`media-monogram ${app.color}`}>
              {app.name.charAt(0)}
            </div>
            <a
              className="link-button"
              href={app.url}
              target="_blank"
              rel="noreferrer"
            >
              Open {app.name}
            </a>
          </Panel>
        ))}
      </div>
    </>
  );
}
export { ComputerPanel as Computer } from "../components/ComputerPanel";
export function Deferred({ display = false }: { display?: boolean }) {
  return (
    <>
      <Intro
        eyebrow={display ? "YOUR SECOND SCREEN" : "A HELPING HAND"}
        title={display ? "Display" : "Talin Voice"}
        description={
          display
            ? "Your Windows workspace on the iPad."
            : "Voice control is not available yet."
        }
      />
      <Panel
        title={display ? "Second display" : "Not listening"}
        className="empty-panel"
      >
        {display ? <Monitor size={56} /> : <Mic size={56} />}
        <p>
          {display
            ? "Use the iPad touchscreen to interact with your extended Windows desktop. This page does not detect the current display connection."
            : "Microphone access is off. No audio is recorded."}
        </p>
      </Panel>
    </>
  );
}
