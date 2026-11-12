import { Check, Sparkles, Palette, Cat } from "lucide-react";
import { useStore } from "../state/Store";
import { themes, type Theme } from "../state/model";
import { Panel } from "./primitives";

const names: Record<Theme, string> = {
  charcoal: "Charcoal",
  slate: "Slate",
  black: "Midnight",
  aurora: "Aurora",
  ember: "Ember",
  ocean: "Ocean",
};
export function AppearanceSettings() {
  const { state, dispatch } = useStore();
  const profile = state.profiles[state.activeProfile];
  return (
    <Panel title="Appearance" className="appearance-settings">
      <p>Make {profile.name}’s corner of Talin your own.</p>
      <div className="theme-picker" role="group" aria-label="Colour theme">
        {themes.map((theme) => (
          <button
            key={theme}
            type="button"
            className={`theme-choice theme-preview-${theme}`}
            aria-label={`${names[theme]} theme`}
            aria-pressed={profile.theme === theme}
            onClick={() => dispatch({ type: "preferences", patch: { theme } })}
          >
            <span className="theme-swatch" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span>{names[theme]}</span>
            {profile.theme === theme && (
              <Check className="theme-selected" size={15} aria-hidden="true" />
            )}
          </button>
        ))}
      </div>
      <label className="setting-row appearance-option">
        <span>
          <Sparkles size={18} aria-hidden="true" /> Gentle motion & glow
        </span>
        <input
          type="checkbox"
          checked={profile.effects !== false}
          onChange={(e) =>
            dispatch({
              type: "preferences",
              patch: { effects: e.target.checked },
            })
          }
        />
      </label>
      <label className="setting-row appearance-option">
        <span>
          <Cat size={18} aria-hidden="true" /> Pixel visitor
        </span>
        <input
          type="checkbox"
          checked={profile.pixelCompanion !== false}
          onChange={(e) =>
            dispatch({
              type: "preferences",
              patch: { pixelCompanion: e.target.checked },
            })
          }
        />
      </label>
      <small>
        <Palette size={13} aria-hidden="true" /> Saved for this profile. Your
        device’s reduced-motion preference always takes priority.
      </small>
    </Panel>
  );
}
