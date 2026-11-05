import { useState } from "react";
import {
  Monitor,
  Mic,
  Laptop,
  Tv,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Power,
  Volume2,
  Home as HomeIcon,
} from "lucide-react";
import { useStore } from "../state/Store";
import { devices, canControl, type ControlCapability } from "../devices/model";
import { DeviceCard } from "../components/DeviceCard";
import { Panel, Go } from "../components/primitives";
import { CalendarContent } from "../components/ResourceState";
import { CalendarConnections } from "../components/CalendarConnections";
import { DeviceControls } from "../components/DeviceControls";
import { AlexaPowerControls } from "../components/AlexaPowerControls";
import { samsungLocal, tuyaCloud } from "../integrations/unconfigured";
export function Devices() {
  const { state } = useStore();
  return (
    <>
      <Intro
        eyebrow="YOUR CONNECTED HOME"
        title="Devices"
        description="Power, timers and readings appear according to each connected device’s verified capabilities."
      />
      <div className="two-columns">
        {devices.map((device) => (
          <div key={device.id}>
            <DeviceCard
              device={device}
              large={device.type === "dehumidifier"}
            />
            <Panel title="Connection plan">
              <p>
                {device.type === "tv"
                  ? "Connect a supported Samsung integration to enable verified power, timer and remote controls. Local pairing alone does not connect the hosted app."
                  : "Tuya cloud and local-key routes need capability and free-access verification before humidity, power or timers can be enabled."}
              </p>
              <p>
                {device.model || "Exact model to be confirmed"} · {device.room}
              </p>
              <p>
                Last updated: {device.updatedAt || "Not yet received"} ·
                Confirmed capabilities:{" "}
                {device.confirmedCapabilities
                  .map((capability) =>
                    capability === "powerTimer" ? "power timers" : capability,
                  )
                  .join(", ") || "None verified"}
              </p>
              {state.profiles[state.activeProfile].favourites.includes(
                device.id,
              ) && <span className="badge">Your favourite</span>}
              <Go to="Settings">Integration settings</Go>
              <AlexaPowerControls deviceId={device.id} />
              <DeviceControls
                device={device}
                adapter={[samsungLocal, tuyaCloud].find(
                  (adapter) => adapter.id === device.adapterId,
                )}
              />
            </Panel>
          </div>
        ))}
      </div>
      <Panel title="Adding more devices">
        <p>
          Future devices need a supported integration and secure pairing.
          Available actions are discovered per device: on/off, timers and
          sensors are not guaranteed for every model. Timers must run on the
          device or a verified online service, so they do not depend on this
          page staying open.
        </p>
      </Panel>
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
  const device = devices[0];
  const key = (
    label: string,
    capability: ControlCapability,
    icon?: React.ReactNode,
  ) => (
    <button
      disabled={!canControl(device, capability)}
      aria-label={label}
      title="Pair the TV and confirm this capability first"
    >
      {icon || label}
    </button>
  );
  return (
    <>
      <Intro
        eyebrow="ENTERTAINMENT"
        title="Samsung Remote"
        description="UE43U8000F · Desk · Not configured"
      />
      <div className="remote-layout">
        <div>
          <Panel title="Samsung TV">
            <div className="tv-preview big">
              <Tv size={64} />
              <span>Awaiting your TV</span>
            </div>
            <p>No power, source, app or volume state is available.</p>
            <Go to="Devices">View connection plan</Go>
          </Panel>
          <Panel title="Apps on the TV">
            <p>
              Shortcuts become available after the TV reports supported
              app-launch capabilities and installed app identifiers.
            </p>
          </Panel>
        </div>
        <Panel title="Remote" className="remote-panel">
          <p className="remote-brand">SAMSUNG</p>
          <div className="remote-top">
            {key("Power", "power", <Power />)}
            {key("Source", "source")}
          </div>
          <div className="dpad">
            {key("Up", "remote", <ArrowUp />)}
            {key("Left", "remote", <ArrowLeft />)}
            {key("OK", "remote")}
            {key("Right", "remote", <ArrowRight />)}
            {key("Down", "remote", <ArrowDown />)}
          </div>
          <div className="remote-row">
            {key("Back", "remote")}
            {key("Home", "remote", <HomeIcon />)}
            {key("Mute", "volume", <Volume2 />)}
          </div>
          <div className="remote-row">
            {key("Volume −", "volume")}
            {key("Volume +", "volume")}
          </div>
          <p>
            All controls are disabled until pairing and capability confirmation.
            No commands have been sent.
          </p>
        </Panel>
      </div>
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
        <CalendarConnections />
      </div>
    </>
  );
}
const media = [
  {
    name: "YouTube",
    url: "https://www.youtube.com/",
    store: "https://apps.apple.com/app/id544007664",
    color: "red",
  },
  {
    name: "Spotify",
    url: "https://open.spotify.com/",
    store: "https://apps.apple.com/app/id324684580",
    color: "green",
  },
  {
    name: "Netflix",
    url: "https://www.netflix.com/",
    store: "https://apps.apple.com/app/id363590051",
    color: "red",
  },
  {
    name: "Prime Video",
    url: "https://www.primevideo.com/",
    store: "https://apps.apple.com/app/id545519333",
    color: "blue",
  },
];
export function Media() {
  return (
    <>
      <Intro
        eyebrow="PICK SOMETHING GOOD"
        title="Media"
        description="Shortcuts for this iPad. TV apps live in Remote."
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
            <a
              className="store-link"
              href={app.store}
              target="_blank"
              rel="noreferrer"
            >
              View in App Store ↗
            </a>
            <small>iPadOS 15 compatibility unverified</small>
          </Panel>
        ))}
      </div>
    </>
  );
}
export function Computer() {
  const [platform, setPlatform] = useState("Windows");
  return (
    <>
      <Intro
        eyebrow="YOUR DESK, CONNECTED"
        title="Computer"
        description="A future companion for your computer. Home works independently."
      />
      <div className="segments platform">
        {["Windows", "macOS"].map((p) => (
          <button
            key={p}
            aria-pressed={p === platform}
            onClick={() => setPlatform(p)}
          >
            {p}
          </button>
        ))}
      </div>
      <Panel title={`${platform} · Not paired`} className="empty-panel">
        <Laptop size={56} />
        <h3>A companion is needed</h3>
        <p>
          Metrics, audio and system controls will need an authenticated
          companion on each computer. No companion has been built or discovered.
        </p>
        <p>
          Wi-Fi transport is planned. USB feasibility and macOS per-app audio
          remain unverified.
        </p>
        <Go to="Settings">Household settings</Go>
      </Panel>
    </>
  );
}
export function Deferred({ display = false }: { display?: boolean }) {
  return (
    <>
      <Intro
        eyebrow={display ? "MORE ROOM TO CREATE" : "A HELPING HAND"}
        title={display ? "Display" : "Talin Voice"}
        description={
          display
            ? "A hand-off, once you choose compatible display software."
            : "Voice control is planned for a later phase."
        }
      />
      <Panel
        title={display ? "Separate software required" : "Not listening"}
        className="empty-panel"
      >
        {display ? <Monitor size={56} /> : <Mic size={56} />}
        <h3>
          {display ? "Your iPad, another possibility" : "A quieter start"}
        </h3>
        <p>
          {display
            ? "Talin Dock does not stream or extend a desktop. Apple Sidecar does not support iPad Air 2. No display host detection or app hand-off is configured."
            : "No microphone access is requested and no audio is captured. Push-to-talk needs a privacy-reviewed speech provider and confirmed device controls first."}
        </p>
        {display && (
          <ol>
            <li>Choose software supporting iPadOS 15 and your computer OS.</li>
            <li>
              Verify a genuinely free option; no paid software is required by
              Talin Dock.
            </li>
            <li>
              Install both clients and test USB or Wi-Fi outside Talin Dock.
            </li>
            <li>
              Record the supported app link and return path for future hand-off.
            </li>
          </ol>
        )}
        <Go to="Settings">Project status</Go>
      </Panel>
    </>
  );
}
