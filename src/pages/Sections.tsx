import {
  Monitor,
  Mic,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Volume2,
  Home as HomeIcon,
} from "lucide-react";
import { useStore } from "../state/Store";
import { canControl, type ControlCapability } from "../devices/model";
import { useDevices, useTuya } from "../data/TuyaContext";
import { TuyaConnection } from "../components/TuyaConnection";
import { tuyaSharing } from "../integrations/tuyaSharing";
import { DeviceCard } from "../components/DeviceCard";
import { Panel, Go } from "../components/primitives";
import { CalendarContent } from "../components/ResourceState";
import { CalendarConnections } from "../components/CalendarConnections";
import { DeviceControls } from "../components/DeviceControls";
import { SamsungLocalConnection } from "../components/SamsungLocalConnection";
import { samsungLocal, tuyaCloud } from "../integrations/unconfigured";
export function Devices() {
  const devices = useDevices(),
    tuya = useTuya();
  const { state } = useStore();
  return (
    <>
      <Intro
        eyebrow="YOUR CONNECTED HOME"
        title="Devices"
        description="Power, timers and readings appear according to each connected device’s verified capabilities."
      />
      <div className="two-columns">
        {devices.map((device) =>
          device.type === "tv" ? (
            <SamsungLocalConnection key={device.id} />
          ) : (
            <div key={device.id}>
              <DeviceCard
                device={device}
                large={device.type === "dehumidifier"}
              />
              <Panel title="Connection">
                <p>
                  {tuya.connected
                    ? "Connected through Smart Life. Sensor measurement age is unavailable; the retrieval time is shown separately."
                    : "Connect Smart Life below to discover humidity, power and timer capabilities."}
                </p>
                <p>
                  {device.model || "Exact model to be confirmed"} ·{" "}
                  {device.room}
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
                <TuyaConnection showSetup={false} />
                <DeviceControls
                  device={device}
                  adapter={[samsungLocal, tuyaCloud, tuyaSharing].find(
                    (adapter) => adapter.id === device.adapterId,
                  )}
                />
              </Panel>
            </div>
          ),
        )}
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
  const devices = useDevices();
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
        description="UE43U8000F · Desk · Secure hub power and timers"
      />
      <div className="remote-layout">
        <div>
          <SamsungLocalConnection />
          <Panel title="Apps on the TV">
            <p>
              Shortcuts become available after the TV reports supported
              app-launch capabilities and installed app identifiers.
            </p>
          </Panel>
        </div>
        <Panel title="Remote" className="remote-panel">
          <p className="remote-brand">SAMSUNG</p>
          <div className="remote-top">{key("Source", "source")}</div>
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
            These additional remote controls remain disabled until their route
            and capabilities are verified. No commands have been sent.
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
export { ComputerPanel as Computer } from "../components/ComputerPanel";
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
