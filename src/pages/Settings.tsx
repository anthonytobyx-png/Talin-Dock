import { useStore } from "../state/Store";
import { profileIds, type Theme } from "../state/model";
import { devices } from "../devices/model";
import { Panel } from "../components/primitives";
export function Settings() {
  const { state, dispatch } = useStore();
  const profile = state.profiles[state.activeProfile];
  return (
    <>
      <div className="page-intro">
        <span className="eyebrow">MAKE IT YOURS</span>
        <h1>Settings</h1>
        <p>Personal touches. Shared foundations.</p>
      </div>
      <div className="two-columns">
        <div>
          <Panel title={`Personal · ${profile.name}`}>
            <p>Applies only to the active profile.</p>
            {state.activeProfile !== "household" && (
              <label className="field">
                Display name
                <input
                  maxLength={40}
                  value={profile.name}
                  onChange={(e) =>
                    dispatch({
                      type: "preferences",
                      patch: { name: e.target.value },
                    })
                  }
                />
              </label>
            )}
            <label className="field">
              Theme
              <select
                value={profile.theme}
                onChange={(e) =>
                  dispatch({
                    type: "preferences",
                    patch: { theme: e.target.value as Theme },
                  })
                }
              >
                <option value="charcoal">Charcoal</option>
                <option value="slate">Slate</option>
                <option value="black">Black</option>
              </select>
            </label>
            <label className="setting-row">
              24-hour clock
              <input
                type="checkbox"
                checked={profile.hour24}
                onChange={(e) =>
                  dispatch({
                    type: "preferences",
                    patch: { hour24: e.target.checked },
                  })
                }
              />
            </label>
            <h3>Calendar visibility</h3>
            <p>
              Preferences for future provider integrations; no calendars are
              connected.
            </p>
            {profileIds.map((id) => (
              <label key={id} className="setting-row">
                {state.profiles[id].name}
                <input
                  type="checkbox"
                  checked={profile.visibleCalendars.includes(id)}
                  onChange={() =>
                    dispatch({
                      type: "preferences",
                      patch: {
                        visibleCalendars: profile.visibleCalendars.includes(id)
                          ? profile.visibleCalendars.filter((x) => x !== id)
                          : [...profile.visibleCalendars, id],
                      },
                    })
                  }
                />
              </label>
            ))}
            <h3>Favourite devices</h3>
            {devices.map((device) => (
              <label key={device.id} className="setting-row">
                {device.name}
                <input
                  type="checkbox"
                  checked={profile.favourites.includes(device.id)}
                  onChange={() =>
                    dispatch({
                      type: "preferences",
                      patch: {
                        favourites: profile.favourites.includes(device.id)
                          ? profile.favourites.filter((id) => id !== device.id)
                          : [...profile.favourites, device.id],
                      },
                    })
                  }
                />
              </label>
            ))}
          </Panel>
        </div>
        <div>
          <Panel title="Household · members">
            <p>
              Shared on this browser. Profiles personalise the display; they are
              not logins or a privacy boundary.
            </p>
            {profileIds.map((id) => (
              <button
                key={id}
                className="profile-row"
                aria-pressed={state.activeProfile === id}
                onClick={() => dispatch({ type: "profile", id })}
              >
                <span className={`avatar ${id}`}>
                  {state.profiles[id].name.charAt(0)}
                </span>
                <span>
                  {state.profiles[id].name}
                  <small>
                    {id === "household"
                      ? "Shared dashboard"
                      : "Personal preferences"}
                  </small>
                </span>
                {state.activeProfile === id && (
                  <span className="selected-label">Active</span>
                )}
              </button>
            ))}
          </Panel>
          <Panel title="Weather & integrations">
            <span className="badge">Not configured</span>
            <p>
              Choose a no-cost weather provider and location before enabling
              weather. Calendar providers require secure account authorisation.
            </p>
            <p>
              Device pairing and credentials will be handled by a future
              authenticated integration service, never by browser storage.
            </p>
          </Panel>
          <Panel title="About this build">
            <p>Phase 1 · Web foundation</p>
            <p>
              No devices, calendars or computers are connected. No audio is
              recorded. Interface preferences are stored on this browser only
              and may be cleared by Safari.
            </p>
          </Panel>
        </div>
      </div>
    </>
  );
}
