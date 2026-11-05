import { useCallback, useEffect, useState } from "react";
import {
  Home as HomeIcon,
  LayoutGrid,
  Tv,
  CalendarDays,
  Music2,
  Mic,
  Laptop,
  Monitor,
  Settings as SettingsIcon,
  House,
  WifiOff,
  Check,
} from "lucide-react";
import { useStore } from "./state/Store";
import { sections, profileIds, type Section } from "./state/model";
import { Home } from "./pages/Home";
import { Settings } from "./pages/Settings";
import {
  Devices,
  Remote,
  Calendars,
  Media,
  Computer,
  Deferred,
} from "./pages/Sections";
import { Modal } from "./components/primitives";
import { InstallStatus } from "./components/InstallStatus";
const icons = {
  Home: HomeIcon,
  Devices: LayoutGrid,
  Remote: Tv,
  Calendars: CalendarDays,
  Media: Music2,
  Voice: Mic,
  Computer: Laptop,
  Display: Monitor,
  Settings: SettingsIcon,
};
export default function App() {
  const { state, dispatch, saved } = useStore();
  const [profilesOpen, setProfilesOpen] = useState(false);
  const close = useCallback(() => setProfilesOpen(false), []);
  const [online, setOnline] = useState(navigator.onLine);
  const profile = state.profiles[state.activeProfile];
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  function page(section: Section) {
    switch (section) {
      case "Home":
        return <Home />;
      case "Settings":
        return <Settings />;
      case "Devices":
        return <Devices />;
      case "Remote":
        return <Remote />;
      case "Calendars":
        return <Calendars />;
      case "Media":
        return <Media />;
      case "Computer":
        return <Computer />;
      case "Voice":
        return <Deferred />;
      case "Display":
        return <Deferred display />;
    }
  }
  return (
    <div className={`app theme-${profile.theme} mode-${state.mode}`}>
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <House size={24} />
          </div>
          <span>
            Talin Dock<small>AT HOME, TOGETHER</small>
          </span>
        </div>
        <div className="mode-switch" aria-label="Mode">
          {(["home", "computer"] as const).map((mode) => (
            <button
              key={mode}
              aria-pressed={state.mode === mode}
              onClick={() =>
                dispatch({
                  type: "navigate",
                  section: mode === "home" ? "Home" : "Computer",
                })
              }
            >
              {mode === "home" ? <HomeIcon size={16} /> : <Laptop size={16} />}
              <span>{mode === "home" ? "Home" : "Computer"}</span>
            </button>
          ))}
        </div>
        <nav aria-label="Main navigation">
          <span className="nav-label">YOUR HOME</span>
          {sections.map((section) => {
            const Icon = icons[section];
            return (
              <button
                key={section}
                className={`nav-item ${section === state.section ? "active" : ""} ${section === "Settings" ? "settings-nav" : ""}`}
                aria-current={section === state.section ? "page" : undefined}
                onClick={() => dispatch({ type: "navigate", section })}
              >
                <Icon size={20} />
                <span>{section}</span>
              </button>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <button
            className="profile-button"
            aria-label="Open profiles"
            onClick={() => setProfilesOpen(true)}
          >
            <span className={`avatar ${state.activeProfile}`}>
              {profile.name.charAt(0)}
            </span>
            <span>
              {profile.name}
              <small>
                {state.activeProfile === "household"
                  ? "Shared dashboard"
                  : "Personal profile"}
              </small>
            </span>
            <span className="profile-chevron">⌃</span>
          </button>
          <p>Your household dashboard</p>
        </div>
      </aside>
      <main id="content" tabIndex={-1}>
        <div className="topbar">
          <span>
            TALIN DOCK <span className="topbar-separator">/</span>{" "}
            {state.section}
          </span>
          <button
            className="profile-chip"
            aria-label={`Switch profile: ${profile.name}`}
            onClick={() => setProfilesOpen(true)}
          >
            <span className={`avatar ${state.activeProfile}`}>
              {profile.name.charAt(0)}
            </span>
            {profile.name}
          </button>
        </div>
        {!online && (
          <div className="notice" role="status">
            <WifiOff size={18} />
            You’re offline. Clock, layouts and saved preferences remain
            available. Live weather and cloud sync need an internet connection.
          </div>
        )}
        {!saved && (
          <div className="notice" role="alert">
            Preferences could not be saved. Changes may be lost on reload; check
            Safari storage settings.
          </div>
        )}
        {page(state.section)}
        <InstallStatus />
      </main>
      {profilesOpen && (
        <Modal title="Who’s using Talin Dock?" close={close}>
          {profileIds.map((id) => (
            <button
              key={id}
              className="profile-row"
              aria-label={`Use ${state.profiles[id].name} profile`}
              onClick={() => {
                dispatch({ type: "profile", id });
                close();
              }}
            >
              <span className={`avatar ${id}`}>
                {state.profiles[id].name.charAt(0)}
              </span>
              <span>
                {state.profiles[id].name}
                <small>
                  {id === "household"
                    ? "A home for everyone"
                    : "Your personal preferences"}
                </small>
              </span>
              {state.activeProfile === id && <Check size={20} />}
            </button>
          ))}
          <p>
            No login. Profiles are display preferences and do not protect
            private data. Idle auto-return can be enabled in Settings.
          </p>
        </Modal>
      )}
    </div>
  );
}
