export const rooms = ["Desk", "Kitchen", "Bedroom"] as const;
export type Room = (typeof rooms)[number];
// One visible Home layout. Preserve legacy keys for backups/cloud compatibility.
export const homeLayoutRoom: Room = "Desk";
export const sections = [
  "Home",
  "Devices",
  "Remote",
  "Calendars",
  "Media",
  "Voice",
  "Computer",
  "Display",
  "Settings",
] as const;
export type Section = (typeof sections)[number];
export type Mode = "home" | "computer";
export const profileIds = ["household", "anthony", "barbara"] as const;
export type ProfileId = (typeof profileIds)[number];
export type Theme = "charcoal" | "slate" | "black";
export type Widget =
  | "calendar"
  | "week"
  | "weather"
  | "humidity"
  | "temperature"
  | "tv"
  | "dehumidifier"
  | "media"
  | "quick";
export const widgetNames: Record<Widget, string> = {
  calendar: "Calendar",
  week: "This week",
  weather: "Weather",
  humidity: "Humidity",
  temperature: "Temperature",
  tv: "Samsung TV",
  dehumidifier: "Dehumidifier",
  media: "Media on iPad",
  quick: "Quick actions",
};
export interface WeatherLocation {
  name: string;
  latitude: number;
  longitude: number;
}
export type WidgetSize = "small" | "wide" | "large";
export interface Profile {
  name: string;
  theme: Theme;
  hour24: boolean;
  idleReturn: boolean;
  visibleCalendars: ProfileId[];
  favourites: string[];
}
export interface AppState {
  version: 1;
  activeProfile: ProfileId;
  room: Room;
  section: Section;
  mode: Mode;
  profiles: Record<ProfileId, Profile>;
  household: {
    layouts: Record<Room, Widget[]>;
    sizes: Record<Room, Partial<Record<Widget, WidgetSize>>>;
    weatherLocation: WeatherLocation | null;
  };
}
export function defaults(): AppState {
  const base: Profile = {
    name: "Household",
    theme: "charcoal",
    hour24: true,
    idleReturn: false,
    visibleCalendars: [...profileIds],
    favourites: [],
  };
  return {
    version: 1,
    activeProfile: "household",
    room: "Desk",
    section: "Home",
    mode: "home",
    profiles: {
      household: { ...base },
      anthony: { ...base, name: "Anthony" },
      barbara: {
        ...base,
        name: "Bárbara",
        theme: "slate",
        visibleCalendars: ["household", "barbara"],
      },
    },
    household: {
      weatherLocation: {
        name: "Monaghan, Ireland",
        latitude: 54.2489,
        longitude: -6.9683,
      },
      sizes: {
        Desk: { calendar: "large", week: "wide" },
        Kitchen: { calendar: "wide", weather: "wide", media: "wide" },
        Bedroom: { dehumidifier: "large" },
      },
      layouts: {
        Desk: ["calendar", "tv", "humidity", "week"],
        Kitchen: ["calendar", "weather", "temperature", "quick", "media"],
        Bedroom: ["dehumidifier", "humidity", "temperature", "tv", "quick"],
      },
    },
  };
}
export type Action =
  | { type: "replace"; state: AppState }
  | {
      type: "household";
      patch: Partial<Pick<AppState["household"], "weatherLocation">>;
    }
  | { type: "size"; room: Room; widget: Widget; size: WidgetSize }
  | { type: "navigate"; section: Section }
  | { type: "room"; room: Room }
  | { type: "profile"; id: ProfileId }
  | { type: "preferences"; patch: Partial<Profile> }
  | { type: "layout"; room: Room; widgets: Widget[] };
export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "replace":
      return action.state;
    case "household":
      return { ...state, household: { ...state.household, ...action.patch } };
    case "size":
      return {
        ...state,
        household: {
          ...state.household,
          sizes: {
            ...state.household.sizes,
            [action.room]: {
              ...state.household.sizes[action.room],
              [action.widget]: action.size,
            },
          },
        },
      };
    case "navigate":
      return {
        ...state,
        section: action.section,
        mode:
          action.section === "Settings"
            ? state.mode
            : ["Computer", "Display"].includes(action.section)
              ? "computer"
              : "home",
      };
    case "room":
      return { ...state, room: action.room };
    case "profile":
      return { ...state, activeProfile: action.id };
    case "preferences":
      return {
        ...state,
        profiles: {
          ...state.profiles,
          [state.activeProfile]: {
            ...state.profiles[state.activeProfile],
            ...action.patch,
          },
        },
      };
    case "layout":
      return {
        ...state,
        household: {
          ...state.household,
          layouts: {
            ...state.household.layouts,
            [action.room]: action.widgets,
          },
        },
      };
  }
}
