import {
  defaults,
  profileIds,
  rooms,
  sections,
  widgetNames,
  type AppState,
} from "./model";
export const STORAGE_KEY = "talin-dock.preferences.v1";
export interface SettingsRepository {
  load(): AppState;
  save(state: AppState): boolean;
}
type StoragePort = Pick<Storage, "getItem" | "setItem">;
// Project only known, non-sensitive fields; malformed or future snapshots fall back safely.
export function decode(raw: string | null): AppState {
  const fallback = defaults();
  if (!raw) return fallback;
  try {
    const data = JSON.parse(raw);
    if (data?.version !== 1) return fallback;
    if (profileIds.includes(data.activeProfile))
      fallback.activeProfile = data.activeProfile;
    if (rooms.includes(data.room)) fallback.room = data.room;
    if (sections.includes(data.section)) fallback.section = data.section;
    fallback.mode =
      (fallback.section === "Settings" && data.mode === "computer") ||
      ["Computer", "Display"].includes(fallback.section)
        ? "computer"
        : "home";
    for (const id of profileIds) {
      const p = data.profiles?.[id];
      if (!p) continue;
      const out = fallback.profiles[id];
      if (typeof p.name === "string" && p.name.trim() && id !== "household")
        out.name = p.name.trim().slice(0, 40);
      if (["charcoal", "slate", "black"].includes(p.theme)) out.theme = p.theme;
      if (typeof p.hour24 === "boolean") out.hour24 = p.hour24;
      if (Array.isArray(p.visibleCalendars))
        out.visibleCalendars = profileIds.filter((x) =>
          p.visibleCalendars.includes(x),
        );
      if (Array.isArray(p.favourites))
        out.favourites = ["samsung-tv", "tuya-dehumidifier"].filter((x) =>
          p.favourites.includes(x),
        );
    }
    for (const room of rooms) {
      const layout = data.household?.layouts?.[room];
      if (
        Array.isArray(layout) &&
        layout.every(
          (x) =>
            typeof x === "string" &&
            Object.prototype.hasOwnProperty.call(widgetNames, x),
        )
      )
        fallback.household.layouts[room] = [
          ...new Set(layout),
        ] as AppState["household"]["layouts"][typeof room];
    }
    return fallback;
  } catch {
    return fallback;
  }
}
export function localSettings(
  getStorage: () => StoragePort,
): SettingsRepository {
  return {
    load() {
      try {
        return decode(getStorage().getItem(STORAGE_KEY));
      } catch {
        return defaults();
      }
    },
    save(state) {
      try {
        getStorage().setItem(
          STORAGE_KEY,
          JSON.stringify(decode(JSON.stringify(state))),
        );
        return true;
      } catch {
        return false;
      }
    },
  };
}
