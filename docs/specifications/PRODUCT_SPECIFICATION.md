# Talin Dock: Product Specification

Version 1.0 · 4 November 2026 · Source: Talin Dock interactive prototype (canvas "Talin Dock", artboards `Main.dc.html` and `Portrait.dc.html`, version 6)

Companion documents: `USER_FLOWS.md`, `FEATURE_MATRIX.md`, `OPEN_QUESTIONS.md`, `SYSTEM_REQUIREMENTS.md`.

Section numbers follow the specification brief. Three sections live in their own files:

| Brief section | File |
|---|---|
| §3 User journeys | `USER_FLOWS.md` |
| §13 Technical requirements | `SYSTEM_REQUIREMENTS.md` (includes the architecture diagram) |
| §14 Missing requirements and unresolved questions | `OPEN_QUESTIONS.md` |

Questions are referenced as Q-n throughout.

---

## 0. How to read this document

### 0.1 What the prototype is

The prototype is a single interactive design component (HTML, CSS and JavaScript in one file) rendered on a design canvas. It runs entirely in the browser, holds all state in memory and resets when reloaded. It contacts no device, account, network service or operating-system API. It is a design artefact for agreeing appearance and behaviour, not a codebase to extend.

Two artboards exist:

- **Landscape, 1024 × 768**: the primary layout (iPad Air 2 in landscape, in CSS pixels).
- **Portrait, 768 × 1024**: the same component with an `orientation = portrait` property. It swaps the sidebar for a narrow icon rail and collapses multi-column layouts to one column.

### 0.2 Status labels used throughout

| Label | Meaning |
|---|---|
| **SIM** | Interactive in the prototype. The control changes simulated state and the change is reflected elsewhere in the interface. |
| **ACK** | Interactive, but the only effect is an acknowledgement (a toast message or a status text). No other state changes. |
| **VIS** | Visible control or information with no behaviour behind it, or a setting that is stored but read by nothing. |
| **COPY** | Behaviour described only in on-screen text (footnotes, helper text). Not represented interactively. |
| **ABSENT** | Not present in the prototype. Listed where the brief or the design implies it. |

### 0.3 Simulation mechanics that affect how the prototype behaves

These are prototype-only behaviours. A reviewer should not read them as product requirements.

- **Clock**: uses the viewing device's real local time, refreshed every 2 seconds.
- **Weather**: fixed values (11°, light rain, high 13°, low 7°, outdoor humidity 86%, wind 18 km/h) and a fixed 5-day forecast. Weekday labels follow the real date.
- **Calendar events**: a fixed list stored as day offsets from "today" (0 to 51 days ahead), so they always appear relative to the current date. Events added in the prototype exist only until reload.
- **Humidity**:
  - When the dehumidifier has the "Power on/off" capability and is on, humidity falls 0.12 points every 2 seconds towards the target, and the water tank fills 0.05 points per tick. At 100% the tank is marked full and the unit stops.
  - Without the power capability, humidity drifts randomly between 58% and 66%.
- **Temperature**: random drift between 18.6 °C and 20.4 °C.
- **Computer metrics**: CPU, GPU and memory values change randomly every 2 seconds. The Mac's memory figure is the Windows figure scaled by 0.62.
- **Connection quality**: fixed text per link type: USB "Excellent · 2 ms", Wi-Fi "Good · 14 ms".
- **Delays**:
  - Device discovery "scan": 1.6 s.
  - Adding a device ("Connecting…"): 1.4 s.
  - App launch hand-off: 0.9 s.
  - Display host check: 1.5 s.
  - Voice: listening about 0.9 s, processing about 0.8 s.

---

## 1. Product overview

### 1.1 What Talin Dock is

Talin Dock is a dedicated household control centre designed to run on an existing iPad Air 2 that stays in one place in the home: on a desk, in a kitchen or in a bedroom. The intent is for the iPad to behave like a fixed appliance rather than a general tablet.

It combines four things in one full-screen interface:

1. **A household dashboard**: clock, date, weather, a shared and personal calendar, scenes, and room-by-room widgets.
2. **Smart-home control**: a device list grouped by room, per-device controls and sensors, discovery and setup, and a dedicated Samsung TV remote.
3. **A media launcher**: opens streaming and music apps already installed on the iPad (YouTube, Spotify, Netflix and others) instead of recreating them.
4. **Optional computer control**: monitoring and audio control of a Windows PC and a Mac through a companion connection, plus guidance and hand-off for using the iPad as an external display.

A push-to-talk voice assistant, **Talin Voice**, sits across these areas.

### 1.2 Problem it solves

- Controls for the household's devices are spread across separate manufacturer apps: SmartThings or the TV's own remote for the Samsung TV, Smart Life for the dehumidifier.
- Calendar information for two people is spread across their own phones and accounts.
- An unused iPad Air 2 cannot run many current apps well. Giving it one fixed job reuses the hardware.
- Computer audio and monitoring require reaching for the computer itself.

### 1.3 Users

Two adults sharing one home: Anthony and Bárbara. The design assumes one physical device shared by both. Neither has to log in, and a shared "Household" profile is the default. Each person also has a personal profile for their own calendar visibility, favourite devices, theme, clock format and voice preferences.

### 1.4 Purposes

- **Primary**: a reliable, attractive, always-visible Home dashboard with working control of the household's smart devices. Today that means the Samsung TV (model UE43U8000F, a Tizen set) and a Smart Life / Tuya dehumidifier.
- **Secondary**:
  - Shared and personal calendar overview, plus adding events.
  - Launching media apps.
  - Voice commands for common actions.
  - Computer monitoring and audio control (Computer mode).
  - Second-monitor hand-off (Display mode).

### 1.5 Intended operating environment

- **Hardware**: Apple iPad Air 2, which runs iPadOS 15 at most and has 2 GB of RAM. It is usually docked and powered, in landscape at 1024 × 768 points, sometimes in portrait.
- **Network**: home Wi-Fi. Some integrations are local only and some depend on cloud accounts. The design must keep Home functions working without a computer, and the brief states that not every function should require the internet.
- **Computers, all optional**:
  - The prototype models one "Windows PC" and one "Mac".
  - The household actually has a Windows desktop, a Windows laptop and a MacBook Pro. The prototype doesn't model this; see `OPEN_QUESTIONS.md` Q-17.
  - Computers are not assumed to be switched on.

### 1.6 How it differs from a conventional smart-home dashboard

| Conventional dashboard | Talin Dock (as designed) |
|---|---|
| Single user, or per-user logins | A shared Household profile by default, plus lightweight personal profiles with no login. Personal versus household settings are separated explicitly. |
| A grid of every entity | Room-specific dashboards with a widget grid. Each room has its own layout. |
| Every device shows the same generic controls | Each device declares what it actually does ("What this device does" capability switches). The interface only shows readings and controls that are switched on. A humidity-only dehumidifier shows only its reading. |
| Media players recreated in the dashboard | A launcher that hands off to the installed apps. |
| Home only | Optional Computer mode for monitoring, a per-app audio mixer and shortcuts, plus a Display mode hand-off. Neither is required for Home functions. |
| Generic visual style | iPadOS visual language: sidebar navigation, grouped lists, iOS-style switches and segmented controls, blue accent in Home mode and purple in Computer mode, a charcoal theme by default, and an Ambient (distance-readable) mode. |

---

## 2. Complete interface inventory

### 2.1 Global shell

**Purpose**: persistent navigation, mode selection and profile access.

**Layout, landscape**: a left sidebar 248 px wide on a darker surface, with the content area to the right. Sidebar contents from top to bottom:

1. App mark and "Talin Dock" title.
2. Mode selector.
3. A "Home" group: Home, Devices, Remote, Voice, Media.
4. A "Computer" group: Computer, Display.
5. A spacer, then Settings.
6. The profile button.
7. The footnote "Prototype · no real devices are connected".

**Layout, portrait**: an 84 px icon rail containing the app mark, a vertical two-button mode selector, all eight sections as icon-plus-label buttons, and a profile avatar button at the bottom.

| Control | Prototype behaviour | Status |
|---|---|---|
| Mode selector: Home / Computer | Sets the mode and jumps to Home or Computer. Changes the accent colour (blue or purple) and leaves edit mode. | SIM |
| Section buttons: Home, Devices, Remote, Voice, Media | Opens the section and switches the mode to Home. | SIM |
| Section buttons: Computer, Display | Opens the section and switches the mode to Computer. | SIM |
| Settings | Opens Settings and keeps the current mode. | SIM |
| Profile button (avatar, name, role) | Opens the profile switcher sheet. | SIM |

- **Information displayed**: the current section is highlighted with a filled accent row, and the current profile's name and role are shown.
- **Persistence**: the selected room, each room's dashboard layout and all settings persist while moving between sections. They are lost on reload, because the prototype has no storage.
- **Real data required**: persisted UI state and the active profile.

**Toasts**: a capsule at the top centre for about 2.4 s, used as acknowledgement throughout. ACK.

### 2.2 Home dashboard

**Purpose**: the main screen. Shows time, date, weather, room state, scenes and the selected room's widgets.

**Layout, top to bottom**:

1. **Header row.**
   - Left: the date (for example "Wednesday 4 November"), a large clock, and a room summary line, for example "Bedroom · 62% humidity · 19.4 °C · 1 accessory".
   - Centre-right: current weather (icon, 11°), "Light rain · H:13° L:7°", and a 4-day mini forecast.
   - Right: the profile chip and an "Ambient" button.
2. **Room row**: a segmented control (Desk, Kitchen, Bedroom and any added rooms) and an "Edit" or "Done" text button.
3. **Scenes row**: four buttons. Good morning, Movie time, Good night, All off.
4. **Widget grid**:
   - 4 columns; rows 152 px tall in landscape, 142 px in portrait.
   - Dense packing.
   - Each widget is small (1×1), wide (2×1) or large (2×2).

| Control | Prototype behaviour | Status |
|---|---|---|
| Profile chip | Opens the profile switcher. | SIM |
| Ambient | Opens the Ambient full-screen overlay. | SIM |
| Room segment | Changes the selected room. The summary line and widget set change to that room's layout. | SIM |
| Edit / Done | Toggles dashboard edit mode (see §5). | SIM |
| Scene buttons | Run the scene against simulated devices, briefly highlight the button, and show "Scene · N changes" (§6.9). | SIM |
| Widget header (title with chevron) | Opens the related detail; see the per-widget list in §5. | SIM |
| Controls inside widgets | See §5. | SIM |

- **Information displayed**:
  - Clock: 24-hour or 12-hour depending on the active profile's preference.
  - Date.
  - Room summary: humidity and temperature appear only if the dehumidifier is in that room, is reachable and has those readings switched on.
  - Weather.
  - Widgets.
- **Simulated**: everything except the clock.
- **Real data required**: device time; weather and forecast for a location that has not been specified; device states and sensor readings; calendar events from the selected calendars; the dashboard layout for each room.
- **Navigation**: it is the default screen. It is also reached through the Home section, the Home mode selector, "Edit Layout on Home" in Settings, and the room "Dashboard" actions.

### 2.3 Ambient mode (full-screen overlay)

**Purpose**: a calm, distance-readable view for when the iPad is left on.

**Layout**: a very dark background covering the whole screen, including the sidebar. Landscape uses two columns; portrait stacks them.

- **Left**: the date, a very large clock (168 px landscape, 150 px portrait), and the weather line.
- **Right**:
  - Humidity, with the sensor's room name, and temperature.
  - "Coming up": the next two events.
  - "Devices": the status of up to three favourite devices for the active profile, or all devices if there are no favourites.
- A hint at the bottom: "Tap anywhere to return".

| Control | Prototype behaviour | Status |
|---|---|---|
| Tap anywhere | Leaves Ambient mode. | SIM |

**Entry points**: the Ambient button in the Home header, and the "Ambient" quick action. "Ambient mode when idle" in Settings is stored but nothing reads it, so ambient mode never starts automatically (**VIS**). Display dimming is **ABSENT**.

**Real data required**: the same as Home. A real version also needs an idle timer, plus a brightness or dimming policy if one is wanted (see Q-23).

### 2.4 Profile switcher (sheet)

**Purpose**: change who is using Talin Dock.

**Layout**: a centred sheet 460 px wide titled "Who's using Talin Dock?". It lists three rows (Household, Anthony, Bárbara), each with an avatar, a description and a checkmark on the current one. A footnote reads "No login. Personal profiles return to Household after 10 minutes idle."

| Control | Prototype behaviour | Status |
|---|---|---|
| A profile row | Switches profile, closes the sheet and shows "Switched to …". | SIM |
| Done, or tapping outside | Closes the sheet. | SIM |

- **What switching changes immediately**:
  - Theme background (Bárbara's default is Slate; the others use Charcoal).
  - Clock format.
  - Which calendars are visible (Bárbara's default hides Anthony's personal calendar).
  - How privacy is applied to other people's calendars.
  - Favourite devices.
  - Media favourite shortcuts.
  - Voice history.
  - Voice language setting, which is stored only and has no effect.
  - Which calendars new events can be written to.
- **The 10-minute auto-return** is **COPY** only. No idle timer exists.

### 2.5 Calendar (sheet)

**Purpose**: a combined agenda for all selected calendars, week and month views, and adding events.

**Opened from**:
- The Calendar widget header, which opens Agenda view.
- The "This week" widget header, which opens Week view at the current week.
- A day in the "This week" strip, which opens Week view with that day selected.
- "New Event" and "Add Event" open the event form inside this sheet.

**Layout**: a sheet 900 px wide in landscape (680 px in portrait) at full height.

- **Left column** (above the main content in portrait):
  - A "Next" card: the next upcoming event's day, time, title, calendar and location.
  - A "Calendars · {profile}" list, each row with a colour dot, name, sharing description and a visibility switch.
  - A "New Event" button and a settings (gear) button.
- **Right column**:
  - A view selector: Agenda, Week, Month.
  - Filter capsules: All, Household, Anthony, Bárbara.
  - The view content.

| Control | Prototype behaviour | Status |
|---|---|---|
| Calendar visibility switch | Shows or hides that calendar for the active profile only. This affects every view, the widgets and Ambient mode. | SIM |
| New Event | Opens the event form for today (Agenda view) or for the selected day (Week and Month views). | SIM |
| Gear button | Closes the sheet and opens Settings › Calendars. | SIM |
| View selector | Switches between Agenda, Week and Month. Week and Month jump to the period containing the selected day. | SIM |
| Filter capsules | Filter the right column to one calendar or all. The left "Next" card and the widgets are not filtered. | SIM |
| Week: previous / next / Today | Moves by one week; Today returns to the current week and selects today. | SIM |
| Week: tap a day header | Selects that day, the target for New Event. | SIM |
| Month: previous / next / Today | Moves by one month; Today returns to the current month and selects today. | SIM |
| Month: tap a date cell | Selects the date and lists its events below. | SIM |
| Month: "Add Event" | Opens the event form for the selected date. | SIM |
| Tapping an event in any view | Nothing happens. No detail, editing or deletion. | ABSENT |

**Views**:

- **Agenda**: "Today" and "Tomorrow" headings always appear, followed by every other day with events across the next 60 days. Each row shows the colour bar, time range (or "All day"), title, calendar name and location. Today's past events are dimmed.
- **Week**: Monday to Sunday columns, each with a weekday and date header (today in an accent circle, the selected day in a white circle) and event blocks showing start time and title, tinted by calendar colour.
- **Month**: a Monday-first grid. Days outside the month are dimmed. Up to three colour dots per day, one per calendar with events. The selected day's events are listed below.

**Event form** (replaces the right column):

- **Fields**: Title (required), Location (optional).
- **Calendar**: a segmented choice limited to calendars the active profile may write to. Household may write only to Household; Anthony to Anthony or Household; Bárbara to Bárbara or Household.
- **All-day** switch.
- **Date** stepper showing the full weekday and date. It cannot go before today.
- **Start** stepper in 15-minute steps from 06:00 to 23:45 (hidden when All-day is on).
- **Duration**: 30 min, 1 h, 1.5 h or 2 h.
- An "Ends at …" note.
- Cancel / Add Event buttons. Add Event is dimmed until a title is entered.

Saving adds the event to the in-memory list, selects its date, makes that calendar visible for the profile, and shows "Added to {calendar} · simulated".

**Privacy display**: when the viewer is not the owner of a personal calendar, that calendar's privacy setting applies:
- Full details: shown normally.
- Busy only: the title becomes "Busy" in italics and the location is removed.
- Hidden: the events are removed.

The Household profile is not the owner of any personal calendar, so it sees both personal calendars through their privacy settings. Defaults: Anthony's is Full details, Bárbara's is Busy only, Household's is always full.

**Simulated**: all calendars, accounts ("Anthony's account · simulated" and so on) and events.

**Real data required**: the calendars available on the device through the operating system's calendar store, including accounts set up on the iPad (no provider assumed); write access to create events; each calendar's owner mapping to a household member; per-profile visibility and privacy settings.

### 2.6 Devices

**Purpose**: the household's accessories, grouped by room, with entry points for discovery and setup.

**Layout**:
- A large title "Devices" with the subtitle "N accessories · M connected · shared by the household".
- Top right: a "Discover" text button and a round "+" button.
- Category capsules with counts: All, Entertainment, Climate, Lights & plugs, Sensors, Cameras.
- One section per room, each a 3-column grid of device tiles.
- An empty state appears when the filter leaves nothing to show.

**Device tile**: a rounded 76 px tile.

- **Left icon button**:
  - Toggles power if the device is reachable and has "Power on/off" switched on.
  - Otherwise it opens the device sheet.
- **Rest of the tile**: opens the device sheet.

**Tile states**:
- **On**: light tile with dark text and the icon on a coloured circle.
- **Off**: dark tile.
- **Sensor-only**: dark tile with teal text, for example "Humidity 62%".
- **Not responding**: orange status text.

**Status text by device type**:
- **TV**: what it is showing, or "Off".
- **Dehumidifier**: mode or "Off" plus the humidity, or "Humidity 62%" when reading-only.
- **Light**: brightness.
- **Air conditioner**: "Cooling to 21°".
- **Sensor**: fixed "55% · 20.5 °C".
- **Camera**: "Live view ready".

| Control | Prototype behaviour | Status |
|---|---|---|
| Category capsule | Filters tiles by category. | SIM |
| Discover | Opens the Nearby Devices sheet. | SIM |
| "+" | Opens the Add Accessory flow at step 1. | SIM |
| Tile icon | Power toggle, or opens the device sheet. | SIM |
| Tile body | Opens the device sheet. | SIM |
| Empty state: Add Accessory | Opens the Add Accessory flow. | SIM |
| Empty state: Restore Sample Devices | Restores removed devices. It only appears when the current filter shows nothing and at least one device has been removed. | SIM |

**Sample devices**:
- "Samsung TV", model 43″ Crystal UHD UE43U8000F, in Desk, connected via "Samsung TV, local network".
- "Dehumidifier", in Bedroom, connected via "Smart Life / Tuya".

**Real data required**: the device registry (identity, type, integration, room, name, capabilities), live state, reachability.

### 2.7 Device settings (sheet, "Accessory")

**Purpose**: one device's controls, readings, capabilities, connection and household settings.

**Layout** (560 px sheet, scrolling):

1. **Header**: icon, name, and "{room} · Connected / Not responding".
2. **Humidity gauge card**, for a dehumidifier with "Humidity reading" on:
   - A 270° ring showing the current humidity.
   - A white marker at the target humidity, if "Target humidity" is on.
   - A comfort note: above, within or below 40–60%.
   - A 12-hour trend line with a green 40–60% comfort band and the min–max range.
3. **Controls** (titled "Readings" for sensors): rows that depend on type and capabilities (table below), plus at most one slider.
4. **A segmented choice** where it applies: the dehumidifier's operating mode, the TV's source, or the air conditioner's mode.
5. **"Open Remote" button**, for a TV with "Remote keys" on.
6. **An empty note** when nothing is switched on: "Nothing to show yet. Turn on what this device can do below."
7. **What this device does**:
   - A preset choice: Readings only / Full control / Custom. Custom is a state indicator only and cannot be selected.
   - One switch per capability, each labelled Sensor or Control.
   - A footnote.
8. **Connection**:
   - "Connected via" with the current route; tapping it expands the list of routes for that type, each with a checkmark.
   - Status: Connected, Not responding, or Integration disconnected.
   - Model, if known.
   - "Simulate connection loss" switch (prototype only).
9. **Household**:
   - Name (editable text).
   - Room (capsules).
   - "Who can use it": Everyone / Anthony / Bárbara.
   - "Show on Home dashboard" switch.
10. **Personal · {profile}**: Favourite switch.
11. **Remove Accessory**, with an inline confirmation: "… will be removed from Talin Dock for everyone. The device itself is not reset." Cancel / Remove.

**Per-type controls in the prototype**:

| Type | Rows / controls (each shown only if its capability is on) |
|---|---|
| TV | Power switch; "Showing" (when on); Volume slider 0–100; Source segmented (TV, HDMI 1–3); Open Remote button |
| Dehumidifier | Gauge (humidity); Power switch; Temperature value; Water tank value; "Tank emptied · Reset" (prototype only); Target humidity slider 35–70% in 5% steps; Operating mode: Auto, Continuous, Sleep, Laundry |
| Light | Power switch; Brightness slider 1–100% |
| Smart plug | Power switch; Power draw value (fixed 7.8 W when on) |
| Sensor | Humidity value (fixed 55%); Temperature value (fixed 20.5 °C) |
| Air conditioner | Power switch; Setpoint stepper 16–30°; Mode: Cool, Heat, Dry, Fan |
| Camera | "Live view · Open" (ACK only); "Last motion: None today" (fixed) |

**Capability sets per type**:

| Type | Capabilities |
|---|---|
| TV | Power on/off; Volume and mute; Input source; Launch apps; Remote keys |
| Dehumidifier | Humidity reading (sensor); Temperature reading (sensor); Power on/off; Target humidity; Operating mode; Water tank status (sensor) |
| Light | Power on/off; Brightness |
| Smart plug | Power on/off; Energy use (sensor) |
| Sensor | Humidity reading; Temperature reading |
| Air conditioner | Power on/off; Temperature setpoint; Operating mode |
| Camera | Live view; Motion alerts (sensor) |

**Connection routes offered per type**:

| Type | Routes |
|---|---|
| TV | Samsung TV, local network; SmartThings; Home Assistant |
| Dehumidifier | Smart Life / Tuya; Tuya local key; Home Assistant; Matter |
| Light | Philips Hue; Matter; Smart Life / Tuya; Home Assistant |
| Smart plug | Smart Life / Tuya; Matter; TP-Link Tapo; Home Assistant |
| Sensor | Matter; Smart Life / Tuya; Home Assistant |
| Air conditioner | Smart Life / Tuya; Matter; Home Assistant |
| Camera | TP-Link Tapo; Home Assistant; Smart Life / Tuya |

| Control | Prototype behaviour | Status |
|---|---|---|
| Controls, sliders, segmented choices | Change simulated device state | SIM |
| Capability switches and presets | Show or hide readings and controls across the whole interface. They also gate remote keys, voice commands and scenes. | SIM |
| Connected via | Changes the route label; also changes whether a connection-manager toggle affects the device | SIM |
| Simulate connection loss | Marks the device "Not responding" everywhere | SIM (prototype tool) |
| Name, Room | Rename the device or move it to another room | SIM |
| Who can use it | Stored. Affects only which devices can appear as personal favourites. It does **not** restrict control. | Partial: VIS |
| Show on Home dashboard | Stored, but nothing reads it. Home has no accessory grid in this version. | VIS |
| Favourite | Adds the device to, or removes it from, the active profile's favourites (Favourites widget, Ambient mode) | SIM |
| Remove → Remove | Marks the device removed, closes the sheet, shows a toast | SIM |
| Done, or tapping outside | Closes the sheet | SIM |

### 2.8 Add Accessory (sheet, 4 steps plus result)

**Purpose**: a generic, manufacturer-independent setup.

**Navigation bar**:

| Step | Left | Right |
|---|---|---|
| 1 | Cancel | Next (disabled until a type is chosen) |
| 2–3 | Back | Next |
| 4 | Back | Add |
| 5 | (none) | Done (enabled once connected) |

**The steps**:

1. **"What are you adding?"**: TV, Dehumidifier, Light, Smart plug, Sensor, Air conditioner, Camera. Choosing a type pre-selects its first route, turns all its capabilities on, and uses the type name as the default device name.
2. **"How does it connect?"**: the routes for that type. The first is labelled "Recommended". Footnote: changeable later.
3. **"What can it do?"**: capability switches. The footnote explains that a humidity-only dehumidifier just shows its reading.
4. **"Name and room"**: name field and room capsules. The default room is the currently selected one.
5. **Result**: "Connecting… Through {route}" for 1.4 s, then "{Name} Added · Connected through {route} · {room}". Done goes to Devices.

**Status**: SIM. No pairing, authentication, discovery or validation happens.

**Known prototype limitation**: a newly added TV or dehumidifier shares the single simulated TV or dehumidifier state with the sample device. Other types have their own state.

**Real data required**: integration-specific pairing (account sign-in, local key, pairing code, bridge button press, server token), the capability list reported by the integration, and the device identifier.

### 2.9 Nearby Devices (Discover sheet)

**Purpose**: find devices on the network that are not yet in Talin Dock.

**Behaviour**:
- "Searching your network…" for 1.6 s, then a "Found nearby" list of three fixed candidates:
  - Smart plug (Smart Life / Tuya · on your Wi-Fi).
  - Temperature & humidity sensor (Matter · ready to pair).
  - Indoor camera (TP-Link Tapo · on your Wi-Fi).
- "Add" opens Add Accessory at step 3, pre-filled with type, route and name. After adding, the row shows "Added".

**Status**: SIM. The candidates are fixed. No scanning takes place.

### 2.10 Remote (Samsung TV)

**Purpose**: a dedicated full-screen remote.

**Layout**: two columns.

- **Left column**:
  - **Status card**: the TV name, a connection dot with "Connected · {route}", and a 16:9 screen preview. The preview shows the current app name, "Home / Smart Hub", "Channel N / Live TV", the input name, or "Off". A volume bar overlay appears for 1.5 s after volume or mute changes.
  - **Three stat tiles**: Power, Source and Volume.
  - **Source capsules** (TV, HDMI 1–3, USB), if "Input source" is on.
  - **Apps card** with "Edit", if "Launch apps" is on.
- **Right column**: a remote 296 px wide (284 px in portrait). From top to bottom:
  - Power (red glyph) and Source buttons, with a "SAMSUNG" label between them.
  - A circular navigation pad with Up, Down, Left, Right and a central OK.
  - Back, Home and Mute, each labelled.
  - Volume and channel rockers (plus and minus, up and down) showing the current values.
  - Previous, Play/Pause and Next.
  - A "last command" line in monospace.

**Key behaviour** (all SIM against a simulated TV):

| Key | Effect | Capability needed |
|---|---|---|
| Power | Toggles on/off | Power on/off |
| Volume + / − | ±1, 0–100, unmutes, shows the volume bar | Volume and mute |
| Mute | Toggles mute, shows the volume bar | Volume and mute |
| Source | Cycles TV → HDMI 1 → HDMI 2 → HDMI 3 → USB; clears the app and home screen | Input source |
| Channel up / down | Channel ±1 (minimum 1), switches to Live TV | Remote keys |
| Home | Shows Smart Hub | Remote keys |
| Back | From an app: to Smart Hub. From Smart Hub: closes it. | Remote keys |
| Up / Down / Left / Right / OK | Logged only (no simulated UI on the TV) | Remote keys |
| Play/Pause | Toggles the "Playing / Paused" label for the current app | Remote keys |
| Previous / Next | Logged only | Remote keys |

Rules:
- Every key except Power requires the TV to be on; otherwise the log shows "TV is off".
- Keys whose capability is off are dimmed to 30% and log "{key} is off in TV settings".
- When the TV is unreachable, keys log "TV not responding".
- Pressed keys briefly highlight (170 ms).

**Apps card**:
- Shows the enabled apps from a sample installed-app list: YouTube, Netflix, Prime Video, Disney+, Apple TV, Spotify, RTÉ Player and Moonlight are on by default; Twitch and Plex are off.
- Tapping an app turns the TV on and shows the app as running.
- Edit shows all apps with a check or plus badge to show or hide each one.

**No TV**: if the TV has been removed, the screen shows "No TV in Talin Dock" with a link to Devices.

**Real data required**: TV reachability and power state; current input and app; volume and mute; the installed TV apps and their identifiers; key-command delivery. Many of these depend on what the TV's control interface exposes (§6.5).

### 2.11 Talin Voice

**Purpose**: push-to-talk voice commands.

**Layout**: a large title and the subtitle "Hold to talk. Prototype: no audio is recorded or processed." In landscape there are two columns.

- **Assistant card**:
  - A phase label: Hold to talk / Listening… / One moment… / Done.
  - A large round microphone button with a ring.
  - A 9-bar level visual, which animates only while listening.
  - A transcript area showing the quoted command and the response, with an effect chip such as "TV on" or "Reading only".
  - Six suggestion capsules.
- **"Recent · {profile}"** list: the last six commands for that profile, with time and response. Tapping one runs it again.

| Control | Prototype behaviour | Status |
|---|---|---|
| Hold the microphone (press and release) | Listening starts on press. On release, the **next command in a fixed rotation** is shown as the transcript and executed. What the user says is not used. | SIM (scripted) |
| Tap the microphone | Runs the full sequence with the next command in the rotation | SIM (scripted) |
| Suggestion capsule | Runs that specific command | SIM |
| Recent row | Re-runs that command | SIM |

**Commands implemented**: see §7.2.

**Real data required**: microphone audio, speech recognition, command interpretation and the household's device registry and state.

### 2.12 Media

**Purpose**: launch installed iPad media apps.

**Layout**:
- A large title, the subtitle "Opens the apps installed on this iPad. Talin Dock never replaces their interfaces.", and "Edit".
- An app grid of large icons: 6 columns in landscape, 5 in portrait.
- Two lists below:
  - "Favourite shortcuts · {profile}": four per profile, such as "Spotify · Dinner at home playlist" or "Netflix · Continue watching".
  - "Recently used", with relative times.
- Footnote: each app opens through its official app link, and missing apps fall back to the App Store page.

**App catalogue in the prototype**:
- Installed: YouTube, Spotify, Netflix, Prime Video, Disney+, YouTube Music, Apple Music, RTÉ Player, Podcasts, Twitch.
- Not installed: Plex, SoundCloud.
- Hidden by default: Apple Music, Twitch, SoundCloud.

| Control | Prototype behaviour | Status |
|---|---|---|
| Installed app icon | A sheet: "Opening {app}…", then after 0.9 s "Opened {app}", with text explaining that the real app would open. Moves the app to the top of Recently used. | SIM (no real launch) |
| Not-installed app icon (Plex) | Sheet: "{app} isn't installed" with "View in App Store" | SIM |
| View in App Store | Closes the sheet; toast "Would open the App Store" | ACK |
| Favourite shortcut | Behaves like launching its app; the deep-link target is not represented | SIM (app only) |
| Recently used row | Launches that app | SIM |
| Edit | Shows all apps with a show/hide badge; tapping toggles visibility in the grid | SIM |

**Real data required**: app availability on the device, a launch identifier per app (app link or URL scheme), per-profile favourites with deep-link targets, and a launch history.

### 2.13 Computer

**Purpose**: monitor and control a paired computer.

**Layout**:
- A large title and a segmented selector: Windows PC / Mac.
- **Status chips**:
  - USB: Active, Connected, Unplugged, or "—".
  - Wi-Fi: Active, Standby, Off, or "—".
  - Quality: "Excellent · 2 ms", "Good · 14 ms", or "—".
  - Auto-reconnect: On / Off.
- **When connected**:
  - **Metrics row**:
    - CPU % with a derived temperature.
    - Memory in GB "of 32 GB" (Windows) or "of 16 GB" (Mac).
    - Graphics % with a derived temperature.
    - Each has a 16-sample bar sparkline.
  - **Sound mixer card**: master volume (mute button plus slider), then five application rows: Spotify, Browser, Discord, Game, System sounds. Each row has an icon, name, value, slider and mute button. System sounds starts muted.
  - **Right column**:
    - Output segmented: Speakers / Headphones / Monitor.
    - A playback card showing "Spotify · Evening Focus Mix" with Previous / Play-Pause / Next.
    - A 3 × 2 shortcut grid.
- **When not connected**: an empty state. Either "{Mac} Not Paired" with an explanation of the companion app and "Pair {Mac}", or "{PC} Disconnected" with reconnection text and "Reconnect". A "Connection Settings" link sits below.

| Control | Prototype behaviour | Status |
|---|---|---|
| Windows PC / Mac | Switches the displayed computer | SIM |
| Master slider and mute | Change simulated master volume and mute | SIM |
| App sliders and mutes | Change simulated per-app volume and mute | SIM |
| Output | Changes the selected output label | SIM |
| Play/Pause | Toggles the icon | SIM |
| Previous / Next | Toast | ACK |
| Shortcuts | Toast "{shortcut} sent to {computer}" | ACK |

Shortcuts on Windows: Lock, Sleep, Screenshot, Task Manager, Show Desktop, Mute Mic. On Mac: Lock, Sleep, Screenshot, Activity Monitor, Mission Control, Mute Mic.

| Control (not connected) | Prototype behaviour | Status |
|---|---|---|
| Pair / Reconnect | Marks the computer paired with Wi-Fi available | SIM |
| Connection Settings | Opens Settings › Connections | SIM |

**Default state**: the Windows PC is paired, with USB and Wi-Fi both available and USB preferred. The Mac is not paired.

**Real data required**: a companion service on each computer providing metrics, an audio-session inventory, volume control, output devices, media control and system commands, plus pairing and transport (§9).

### 2.14 Display

**Purpose**: guidance and hand-off for using the iPad as an extended display.

**Layout**:
- A large title and subtitle.
- An accent note: "Separate display software is required on both the computer and this iPad. Talin Dock checks the connection and hands off to that app; this prototype does not extend a desktop."
- Two grouped sections, Windows PC and Mac, each with:
  - An "Extended display" status.
  - A USB / Wi-Fi segmented choice.
  - Four numbered setup steps.
  - A "Check for Display Host" button.
- An "About display software" note covering iPadOS 15 compatibility, Sidecar not being available on this iPad, USB usually having lower latency, and no specific app being assumed.

| Control | Prototype behaviour | Status |
|---|---|---|
| USB / Wi-Fi | Changes the selected method label | SIM |
| Check for Display Host | "Checking over {method}…", then after 1.5 s "No display host found" with an explanation | SIM (always fails) |

**Real data required**: none from Talin Dock beyond which display app to hand off to. Whether Talin Dock can detect a display host at all is undecided (Q-12).

### 2.15 Settings

**Layout**: a large title, then two columns in landscape (one in portrait).

- **Left list**:
  - "Personal · {profile}": Profile, Calendars, Theme & display, Talin Voice.
  - "Household": Members, Rooms, Dashboards & widgets, Device integrations, Connections, App shortcuts, About.
- **Right panel**: the page title plus a scope line. Either "Personal · applies only to {name}", "Household defaults · used when no personal profile is active" (personal pages while Household is active), or "Household · applies to everyone".

| Page | Contents and controls | Status |
|---|---|---|
| Profile | Avatar, name, role, "Switch" (opens the profile sheet). "Favourite devices": a switch per device the profile may use. "Return to Household when idle" switch with a 10-minute footnote. | Favourites SIM; Switch SIM; idle return VIS (stored, no timer) |
| Calendars | "Show in agenda": per-calendar visibility switches. "Sharing": per-calendar Full details / Busy only / Hidden. Only the owner's profile may change its own calendar; others get a toast. The Household calendar's sharing level is fixed: it is always shared with everyone, although each profile can still hide it from its own view. An explanatory note covers iPadOS accounts. | SIM |
| Theme & display | Theme: Charcoal / Slate / Black (per profile). 24-hour time switch. "Ambient mode when idle" switch. | Theme SIM; 24-hour SIM; ambient-when-idle VIS |
| Talin Voice | Spoken responses, Hold to talk and Show transcript switches. Language: English (Ireland), English (UK), Português (Brasil). | All VIS (stored, no effect) |
| Members | Household, Anthony and Bárbara rows with a checkmark on the active one. Tapping switches profile. Explanatory footnote. | SIM. Adding or editing members is ABSENT. |
| Rooms | A row per room with accessory and widget counts. A delete button appears for rooms with no devices (when more than one room exists). "Add Room" adds the next name from a fixed list (Living room, Office, Hallway, Bathroom, Guest room) with a default layout of Calendar (wide) and Weather (wide). | SIM. Renaming rooms or choosing a name is ABSENT. |
| Dashboards & widgets | A room selector (shared with Home), then one switch per widget type for that room with its current size shown, and "Edit Layout on Home". | SIM |
| Device integrations | Each route with its kind and number of devices using it. Read-only. | VIS (informational) |
| Connections | "Smart home": Home Assistant (Not set up by default), Samsung TV, Smart Life / Tuya, each with Connect/Disconnect or Set Up. Then a section each for Windows PC and Mac: Status, USB (Unplug / Plug in), Wi-Fi (Drop / Restore), Quality, Preferred connection (USB / Wi-Fi), Reconnect automatically, Pair / Unpair. | SIM (§9.7) |
| App shortcuts | "Media hub": a show switch per media app, with installed status. "TV remote shortcuts": a show switch per TV app. Footnote: TV apps are read from the TV once connected. | SIM. Reading TV apps from the TV is COPY. |
| About | Prototype disclaimer | Informational |

---

## 4. Household and user management

### 4.1 Profiles

| Profile | Purpose | Default characteristics in the prototype |
|---|---|---|
| Household | The default. Shared dashboard for whoever is present. | Charcoal theme, 24-hour clock, all calendars visible, favourites TV and Dehumidifier |
| Anthony | Personal | Charcoal theme, all calendars visible, favourites TV and Dehumidifier |
| Bárbara | Personal | Slate theme, voice language Português (Brasil), Anthony's personal calendar hidden, favourite Dehumidifier |

Switching is one tap from the sidebar, the Home header chip, Settings › Members or Settings › Profile. No authentication of any kind exists.

### 4.2 Personal settings (per profile)

Stored separately for each profile, including Household's own defaults:

- **Have an effect today**: theme background, 24-hour time, calendar visibility, favourite devices, media favourite shortcuts and voice history.
- **Stored but not yet wired to anything**: ambient-when-idle, voice spoken responses, hold to talk, show transcript, and voice language.

### 4.3 Household-wide (shared) settings

- Rooms and each room's dashboard layout.
- Devices: name, room, route, capabilities, access, "Show on Home" and removal.
- Scenes, which are fixed and not editable.
- Connections, computer pairing, media and TV app shortcut lists.
- Calendar privacy, which is per calendar, set by its owner and applies to everyone else.

### 4.4 Room configurations

Rooms are household-wide. Each room has one widget layout shared by all profiles. Layouts are **not** per profile.

### 4.5 Shared devices

All devices are household devices and appear for every profile. "Who can use it" (Everyone / Anthony / Bárbara) exists, but in the prototype it only filters which devices can be personal favourites. It does not hide or lock control for the other person (see Q-8).

### 4.6 Personal and shared calendars

There are three calendars: Anthony (personal), Bárbara (personal) and Household (shared). Visibility is chosen per profile. Privacy (full details, busy only, hidden) is chosen by each calendar's owner and applies to everyone else, including the Household profile.

New events may be written to:
- From Household: the Household calendar only.
- From a personal profile: that person's own calendar or Household.

### 4.7 Permissions and privacy: what the design does and does not guarantee

- Privacy is **display-level only**. Anyone holding the iPad can switch to any profile and see that person's full calendar and settings.
- If personal calendars come from accounts signed in on the iPad itself, those accounts are also readable through the iPad's own Calendar app, outside Talin Dock.
- Changing a calendar's privacy requires being in the owner's profile, but since switching profiles needs no authentication, this is a courtesy control, not a security control.

### 4.8 Is authentication necessary?

The design deliberately has none, to keep the dashboard usable by both people without logging in. Whether that is acceptable for personal calendars, and for any account credentials the integrations hold, is an open decision (Q-7, Q-9).

### 4.9 When one user changes a shared setting

In the prototype, shared changes apply immediately for everyone, with no notification, history or undo. This covers:
- Renaming or moving a device, or changing its capabilities or route.
- Removing a device ("for everyone", as the confirmation states).
- Editing a room's layout.
- Disconnecting an integration.

No conflict handling exists because there is only one device.

### 4.10 Missing decisions

The full list is in `OPEN_QUESTIONS.md`. The main ones:

- Whether personal profiles need any protection, such as a PIN for the privacy controls (Q-7).
- Whether layouts or scenes should differ per profile (Q-21).
- Whether "Who can use it" should restrict control (Q-8).
- How the idle auto-return to Household should behave (Q-22).
- How guests are handled.
- Whether there is a phone or second-device companion.

---

## 5. Widget system

### 5.1 Model implied by the prototype

- Each room has an ordered list of widget instances. Each instance has a type and a size: small 1×1, wide 2×1, or large 2×2.
- The grid has 4 columns with fixed row heights and dense packing. Dense packing fills gaps, so the visual position can differ from the list order when sizes vary.
- At most **one instance of each type per room**; the Add list offers only types not already present.
- The same type can appear in several rooms, as separate instances with independent sizes.
- Widgets have no per-instance settings; everything a widget shows comes from global state.

### 5.2 Edit mode

Entered with "Edit" on Home, or "Edit Layout on Home" in Settings.

- Each widget gets a dashed accent border and a dimmed overlay showing its size name and four buttons: move earlier, resize (cycles through the sizes the type allows), move later, remove.
- An "Add to {room}" tray lists the missing widget types as capsules. Adding one appends it at its first allowed size.
- "Done" leaves edit mode. Changes apply immediately; there is no cancel or undo.
- Settings › Dashboards & widgets offers per-type on/off switches for the selected room, which is equivalent to adding or removing.
- An empty room outside edit mode shows "{room} has no widgets. Add Widgets".

### 5.3 Widget catalogue

| Widget | Sizes | Displays | Data source (real) | Interactive | Header opens | Data unavailable (prototype) |
|---|---|---|---|---|---|---|
| Calendar | S, W, L | S: next event (when, time, title, calendar). W: next 2 events. L: next 5. | Calendar store, filtered by profile visibility and privacy | Header only | Calendar sheet, Agenda | S shows "Nothing scheduled" |
| This week | W, L | 7-day strip from today (weekday, date, up to 3 calendar dots). W: "N events in the next 7 days". L: plus the next 5 events. | Calendar store | Day buttons open Week view on that day | Calendar sheet, Week | "Nothing in the next 7 days" |
| Weather | S, W | S: icon, temperature, condition, H/L, wind. W: plus a 5-day forecast. | Weather service for a location (undecided) | No | (none) | Not handled; always shows sample data |
| Humidity | S, W | S: current % with sensor room, comfort note and bar. W: one row per room ("No sensor" where none) plus outdoor 86%. | Any humidity-capable device; in the prototype only the dehumidifier | Header | Dehumidifier sheet | "—" and "No humidity sensor" |
| Temperature | S, W | S: current temperature with sensor room, plus "Outside 11°". W: per room plus outdoor. | Temperature-capable device; prototype: the dehumidifier | Header | Dehumidifier sheet | "—" and "No temperature sensor" |
| TV | S, W | Power button, state ("Off", app, channel, "Not responding"), room. W: plus 3 TV app shortcuts. | TV integration | Power toggle; app shortcuts launch on the TV | Remote | "No TV in Talin Dock" |
| Dehumidifier | S, W, L | S: humidity %, status, room, power button (if power capability). W: gauge with target marker, status, mode and temperature line, target stepper, power. L: plus mode selector and water tank bar. | Dehumidifier integration | Power, target ±5%, mode | Device sheet | "No dehumidifier in Talin Dock"; "Not responding" status |
| Media | S, W | YouTube, Spotify, Netflix and Prime Video icons (labels in W) | App availability | Each icon launches the iPad app | Media | Not handled |
| Favourites | W, L | The active profile's favourite devices as mini tiles (2 in W; up to 6 in L, which can clip) | Device registry plus profile favourites | Tile icon toggles power; tile opens the sheet | Devices | "No favourites for {profile} yet…" |
| Quick actions | S, W | Ambient, Remote, Talin Voice, Mute TV (fixed) | (none) | Each runs its action | (none) | n/a |

**Default layouts**:
- **Desk**: Calendar L, TV S, Humidity S, This week W.
- **Kitchen**: Calendar W, Weather W, Temperature S, Quick actions S, Media W.
- **Bedroom**: Dehumidifier L, Humidity S, Temperature S, TV S, Quick actions S.

**Not represented in the prototype**:
- Per-widget configuration, such as choosing which sensor a Humidity widget shows, which calendars a Calendar widget shows, or which apps the Media widget shows.
- Stale-data indicators.
- Loading states.

### 5.4 Behaviour to specify for a real implementation

- **Reordering under dense packing**: decide whether the user's list order or the packed visual order is authoritative (Q-20).
- **Resizing**: when a widget grows, the rest of the layout reflows.
- **Removal**: removes only the widget, never data.
- **Persistence**: layout persists per room across restarts.
- **Unavailable data**: each widget needs defined "loading", "stale", "unavailable" and "not configured" states. The prototype defines only "not configured" or "missing device" states for some widgets.

---

## 6. Device and smart-home functionality

### 6.1 Device model implied by the prototype

Each device record holds:

- Identity and **type**: tv, dehum, light, plug, sensor, ac, camera.
- **Name** and **room**.
- **Connection route**: the integration, for example Samsung local, SmartThings, Tuya cloud, Tuya local, Home Assistant, Matter, Hue, Tapo.
- **Model** (optional).
- **Online** flag.
- **Capability switches**, from the type's capability list.
- **Access**: everyone or one member.
- **Show on Home** flag.
- Type-specific state.

A device is "live" only if it is online **and** its route's connection is up. Samsung local, Tuya (cloud and local) and Home Assistant routes map to the three toggles in Connections. SmartThings, Matter, Hue and Tapo routes have no connection toggle in the prototype, so they are always treated as up.

### 6.2 Capability principle

Capabilities are switched on by the user, per device, in the add flow and in device settings, with presets "Readings only" and "Full control". Everything downstream follows them:

- Tiles show reading-only or controllable states accordingly.
- Widgets show only the controls that are on.
- The remote dims keys whose capability is off.
- Scenes skip devices without the capability.
- Voice commands answer that a capability is unavailable.

In a real product, the integration should report which capabilities the device actually supports. The user's switches should then only be able to reduce that set, not invent capabilities the device lacks. The prototype lets the user switch on anything; see Q-4.

### 6.3 Discovery and adding

- **Discovery** (prototype): fixed candidates after a short delay.
- **Real discovery** would differ by integration:
  - Local network discovery for TVs and Matter devices.
  - Account-based import for cloud integrations, which list the devices already in the user's account.
  - Bridge discovery, such as Hue.
  - Server import, such as Home Assistant.
- **Adding**:
  - Prototype: type → route → capabilities → name and room → "connected".
  - Real: the route-specific pairing step is missing between "route" and "capabilities". It may involve signing in to an account, entering a local key, scanning a pairing code, pressing a bridge button, or approving a pairing prompt on the TV.

### 6.4 Categories and rooms

- **Categories** are derived from type: Entertainment (TV), Climate (dehumidifier, air conditioner), Lights & plugs, Sensors, Cameras.
- **Rooms** are user-defined from a fixed set of names in the prototype. Each device belongs to exactly one room. Moving a device changes which room's summary, humidity row and Devices section it appears in.

### 6.5 Samsung TV (concrete example)

**Prototype representation**:
- Device "Samsung TV", model 43″ Crystal UHD UE43U8000F.
- Default route "Samsung TV, local network". Alternatives: SmartThings, Home Assistant.
- Capabilities: Power, Volume and mute, Input source, Launch apps, Remote keys.
- Remote functions are listed in §2.10; the TV widget in §5.3; device-sheet controls in §2.7.

| Function | In prototype | Depends on |
|---|---|---|
| Power off | SIM | TV control interface |
| Power on from standby | SIM | Whether the TV accepts commands in standby or needs a separate wake mechanism. It depends on the route and on the TV's network standby settings. **To verify for this model** (Q-5). |
| Directional keys, OK, Back, Home | SIM (logged) | TV key-command support |
| Volume ±, mute | SIM | TV key-command support; the real current volume may not be readable on every route (Q-5) |
| Channel ± | SIM | Meaningful only if the TV is used with a tuner or aerial; also a key command |
| Play/Pause, Previous, Next | SIM | Key commands; the effect depends on the app in the foreground |
| Source selection | SIM (cycle or direct pick) | Direct input selection versus cycling depends on the route |
| App launch | SIM | Requires the TV's installed-app identifiers; the list may need to be read from the TV or configured manually |
| Current app or input shown | SIM | Whether the route reports foreground app or input. **Uncertain** |
| Connection status | SIM | Reachability detection |

**Note on the household's TV**: the TV has developer mode enabled and Moonlight sideloaded, which is why Moonlight appears in the app list. Whether sideloaded apps can be launched through the chosen route is unverified.

### 6.6 Smart Life / Tuya dehumidifier (concrete example)

**Prototype representation**:
- Route "Smart Life / Tuya". Alternatives: Tuya local key, Home Assistant, Matter.
- Default capabilities in the current prototype: all six switched on, so the full detail screen can be reviewed.

**Real-world constraint, from the product owner**: the household's actual dehumidifier reports **room humidity only**; the owner has no other control over it. The "Readings only" preset reproduces that. The prototype default (full control) therefore does not represent the real unit (Q-3).

| Data point | Prototype | Real-world dependency |
|---|---|---|
| Current humidity | Gauge, trend, widgets, Ambient, voice | Reported by the actual unit. Update interval depends on the route; cloud routes may report less often than local ones. |
| Temperature | Optional reading | Model-dependent; may not exist on this unit |
| Power on/off | Optional control | Model- and route-dependent; reported as unavailable on this unit |
| Target humidity | Slider 35–70%, 5% steps | Range and step are model-specific; the prototype values are placeholders |
| Operating modes | Auto, Continuous, Sleep, Laundry | Mode names and availability are model-specific; placeholders |
| Water tank | % with a full state; a "Reset" action exists only in the prototype | Real units usually report a binary "tank full" flag, not a percentage. **To verify**. |
| Trend (12 h) | Seeded history plus the live value | Requires Talin Dock, or the hub, to store history; Tuya does not necessarily provide it |

### 6.7 Other types (future)

The prototype already defines capability lists and routes for lights, smart plugs, sensors, air conditioners and cameras (§2.7). Their behaviour is placeholder only:

- Sensor values are fixed at 55% and 20.5 °C, and sensors are **not** wired into the Humidity or Temperature widgets. Only the dehumidifier feeds them.
- Plug energy is fixed at 7.8 W.
- Camera "Live view" is acknowledgement only.

### 6.8 Accommodating more manufacturers

The design implies an adapter model. Each integration (route):
- Declares which device types it supports.
- Performs discovery and pairing.
- Reports each device's actual capabilities and state.
- Accepts commands.
- Reports reachability.

The interface reads only the normalised capability and state model. Home Assistant appears as one possible route, a "local server" that may already manage many devices, not as a required backbone. Whether it should be the backbone is a key architecture decision (Q-1).

### 6.9 Scenes

There are four fixed scenes. They are not editable, cannot be scheduled and have no triggers.

| Scene | Effect in the prototype (only on devices that are live and have the capability) |
|---|---|
| Good morning | Dehumidifier on, in Auto mode if mode is supported; lights on |
| Movie time | TV on, launches Netflix (requires power and apps) |
| Good night | TV off (if on); plugs, lights and air conditioners off; dehumidifier on in Sleep mode |
| All off | TV off; plugs, lights and air conditioners off; dehumidifier off |

Each run reports the number of changes, or "no changes". Automations (time-based or sensor-based) are **ABSENT**.

### 6.10 Errors and unavailable states

- **"Not responding"**: shown on tiles, in sheets and on the remote when the device is offline or its integration is disconnected. The sheet distinguishes "Not responding" from "Integration disconnected".
- **Commands to an unavailable device** produce a toast or log ("Samsung TV is not responding"), and scenes skip such devices.
- **Missing from the prototype**:
  - Stale-data timestamps. The only "last updated" text is the static "Last 12 hours" label.
  - Partial failures within a scene.
  - Command time-outs.
  - Retry behaviour.

---

## 7. Voice functionality (Talin Voice)

### 7.1 Interaction

- **Push-to-talk**: press and hold the microphone to listen, release to process. Tapping runs a full cycle.
- **States**: idle → listening → processing → response.
- **Wake word**: **ABSENT**. No always-listening mode is designed. The setting "Hold to talk" (off = tap to start and stop) is stored but has no effect.
- **Settings**: spoken responses, show transcript and language (English Ireland, English UK, Português Brasil) are stored per profile with **no effect** in the prototype.

### 7.2 Commands implemented (scripted)

| Command | Prototype effect and response |
|---|---|
| "Turn on the TV" | If the TV is live with power: turns it on, "Turning on the Samsung TV in {room}." Otherwise "The TV isn't available for power control right now." |
| "Open YouTube on the TV" | If live with apps: TV on with YouTube. Otherwise unavailable. |
| "What is the bedroom humidity?" | If a humidity reading is available: "It's 62% in {dehumidifier room}.", plus running or off status when the power capability exists. It uses the dehumidifier's room regardless of the room named. |
| "Turn on the dehumidifier" | No dehumidifier: "There is no dehumidifier…" No power capability: "This dehumidifier only reports readings…" Tank full: blocked. Otherwise turns it on. |
| "What's the weather today?" | A fixed sample forecast |
| "Good night" | Runs the Good night scene and reports what changed |

Each response carries an effect chip and is added to that profile's history.

### 7.3 Interpretation, failure and unavailability (intended)

The prototype has no interpretation step. In a real version:
- Recognised speech must map to an intent (action, target device or room, parameters).
- The target is resolved against the device registry, checking capability and reachability.
- Then the command executes and a response is given.

Defined failure responses in the prototype: device absent, capability off, device not live, tank full.

Not defined:
- Unrecognised speech.
- Ambiguous targets ("the light" with several lights).
- Room-qualified requests where the room has no matching device.
- Partial success.
- Time-outs.

### 7.4 Basic versus advanced

- **Basic**, implied by the prototype: a fixed grammar of device on/off, launching an app on the TV, reading a sensor, running a scene, and weather.
- **Advanced**, not in the prototype: free-form conversation, follow-up questions, multi-step requests, calendar queries ("what's on tomorrow?"), creating events by voice, and computer commands by voice.

### 7.5 Local versus external processing

To be decided (Q-14). Device control and reading local state should not need the internet. Speech recognition and intent interpretation could run on the device, on a local server or computer, or in an external service. The choice affects offline behaviour, privacy, Portuguese support and latency on an iPad Air 2.

---

## 8. Media functionality

### 8.1 Behaviour

- Talin Dock lists media apps and hands off to the installed app. It never recreates the app's interface. The "Now playing" player from earlier prototype iterations has been removed.
- **Selecting YouTube** opens the installed YouTube app; **selecting Spotify** opens the installed Spotify app. The prototype shows "Opening …" then "Opened …" and moves the app to the top of Recently used.
- **Favourite shortcuts** represent deep links (a playlist, a "continue watching" row). In the prototype they launch only the app.
- **Configurable**: which apps appear (Edit on Media, or Settings › App shortcuts).
- **Availability**: Plex and SoundCloud are modelled as not installed and show the App Store fallback.

### 8.2 Expected real launch behaviour

1. Check whether the app is available on the device, where the platform allows such a check.
2. Launch through the app's official app link or URL scheme, optionally with a deep-link target.
3. If it is unavailable, offer the store page.
4. If the deep link fails but the app opens, accept that.
5. Record the launch in the recently-used history.

### 8.3 Two different launch targets (important)

- The **Media** section and the **Media widget** launch apps **on the iPad**.
- The **TV widget**, the **Remote's Apps card** and the voice command "Open YouTube on the TV" launch apps **on the TV**.

The same app names appear in both places. The interface relies on context to distinguish them (Q-19).

### 8.4 Compatibility risk

Current versions of some streaming apps may no longer install on iPadOS 15. Availability on this specific iPad must be verified per app (Q-13).

---

## 9. Computer integration

### 9.1 Scope

Computer mode is independent of Home. Nothing in Home depends on a computer. A computer must run a companion service for any of this to work. The prototype refers to "the Talin Dock companion app" and pairing "with the code shown here"; no pairing code is actually shown.

### 9.2 Connection management

- Each computer has: paired (yes/no), USB link available, Wi-Fi link available, preferred link (USB or Wi-Fi), and auto-reconnect (on/off).
- **Active link**:
  - The preferred link, if it is available.
  - Otherwise, if auto-reconnect is on, whichever link is available.
  - Otherwise disconnected.
- Simulated events, all via Settings › Connections: unplugging USB, dropping Wi-Fi, restoring either, pairing and unpairing. Switching links produces "{computer}: switched to Wi-Fi"; losing all links "{computer} disconnected"; regaining "{computer} reconnected over …".
- The status chips on Computer reflect this state.

### 9.3 Information needed from the computer

| Item | Windows | macOS | Notes |
|---|---|---|---|
| CPU load % | Required | Required | Temperature in the prototype is derived and not real; real CPU temperature may need elevated access |
| Memory used / total | Required | Required | |
| GPU load % (and temperature) | Required | Required | GPU metrics on macOS may be restricted. **Uncertain**. |
| Audio sessions per application (name, icon, volume, mute) | Required | Required | macOS does not natively offer per-application volume. This likely needs an additional audio component. **High risk** (Q-16). |
| Master volume and mute | Required | Required | |
| Output devices and the current one | Required | Required | |
| Now-playing information | Implied by the card | Implied | The prototype shows static text |
| Link quality / latency | Required | Required | Measured by Talin Dock or the companion |

### 9.4 Commands sent to the computer

- Set master volume and mute; set per-app volume and mute; select the output device.
- Media: play/pause, previous, next.
- Shortcuts:
  - Windows: Lock, Sleep, Screenshot, Task Manager, Show Desktop, Mute Mic.
  - macOS: Lock, Sleep, Screenshot, Activity Monitor, Mission Control, Mute Mic.
- Behaviour after "Sleep" (connection drop, reconnection when the computer wakes) is not defined.

### 9.5 Separation of Windows and macOS

The prototype presents identical layouts. Differences appear only in the shortcut list, the memory total, and the Mac being unpaired by default. Real functional parity is not guaranteed (§9.3).

### 9.6 Household computers

The household has a Windows desktop, a Windows laptop and a MacBook Pro. The prototype supports exactly one Windows PC and one Mac. Its "32 GB" figure happens to match the desktop. Supporting more than one computer per platform is undecided (Q-17).

### 9.7 Reconnection behaviour

The intended rules are in §9.2. Not defined:
- Retry intervals.
- How long before a computer is shown as disconnected.
- Behaviour when the computer is asleep versus off.
- Wake-on-LAN, which is not in the prototype.

---

## 10. External display functionality

### 10.1 What Talin Dock does

- Guides setup with steps per platform.
- Lets the user choose USB or Wi-Fi.
- Offers a "Check for Display Host" action and shows the result.
- States plainly that separate software is required and that Talin Dock hands off to it.

### 10.2 What Talin Dock does not do

- It does not stream or extend a desktop.
- The display technology belongs entirely to third-party software running on both the computer and the iPad.
- Resolution, latency, refresh rate, touch and pen input and audio are properties of that software. The prototype states none of them.

### 10.3 Dependencies and constraints

- Apple Sidecar is not available on the iPad Air 2. A Mac therefore needs third-party software.
- The chosen display app's iPad client must still support iPadOS 15.
- Wired connections usually offer lower latency than Wi-Fi where the software supports them.
- No specific software is assumed.

### 10.4 Uncertain points

- Whether Talin Dock can detect a display host at all, as opposed to only launching the display app (Q-12).
- Whether Talin Dock stays usable alongside it. While the iPad is acting as a display, Talin Dock is presumably in the background, and how the user returns is not designed.

---

## 11. Data and integrations inventory

| Information | Source (real) | Update frequency / behaviour | Internet required | Works locally | Account required | Simulated now |
|---|---|---|---|---|---|---|
| Time and date | Device clock | Each second or minute | No | Yes | No | No (real) |
| Weather and forecast | A weather service for a configured location | About every 15–60 min; cached | Yes | No (cache only) | Depends on service | Yes |
| Calendars and events | OS calendar store (accounts on the iPad) | Immediate on store change; read on open | Only for the account to sync | Read from the local store, yes | Yes (each person's calendar account) | Yes |
| Event creation | OS calendar store | On save | For sync | Saved locally, syncs later | Yes | Yes |
| Household profiles and personal prefs | Talin Dock local storage | On change | No | Yes | No | Yes (in memory) |
| Device registry (names, rooms, routes, capabilities, access) | Talin Dock local storage, plus integration import | On change | No | Yes | Depends on route | Yes |
| Device states | Each integration | Push where supported; otherwise polling | Cloud routes: yes. Local routes: no. | Local routes only | Cloud routes: yes | Yes |
| Humidity | Dehumidifier via its route; future sensors | Depends on route; cloud may be minutes | Tuya cloud: yes. Tuya local or HA: no. | Depends on route | Tuya cloud: yes | Yes |
| Temperature | As humidity (if the device supports it) | As above | As above | As above | As above | Yes |
| Humidity history (12 h trend) | Stored by Talin Dock or a hub | Append on each reading | No | Yes | No | Yes (seeded) |
| TV status (power, input, app, volume) | TV route | On command, plus periodic check | Local: no. SmartThings: yes. | Local route: yes | SmartThings: yes | Yes |
| TV installed apps | TV route, or manual configuration | On connect, plus occasional refresh | As above | As above | As above | Yes (sample list) |
| iPad media app availability | OS app-availability check, where permitted | On open | No | Yes | No | Yes |
| Computer statistics (CPU, memory, GPU) | Companion service | About 1–2 s while visible | No | Yes (USB or LAN) | Pairing, not an internet account | Yes |
| Application audio levels and sessions | Companion service | On change and while visible | No | Yes | Pairing | Yes |
| Computer link status and quality | Talin Dock and the companion | Continuous heartbeat | No | Yes | Pairing | Yes |
| Display host presence | Third-party display software (if detectable) | On check | No | Yes | Depends on software | Yes |
| Voice audio | iPad microphone | During push-to-talk | No | Yes | No | No audio captured |
| Voice recognition and intent | On-device, local server, or external service (undecided) | Per command | Only if external | Undecided | Only if external | Yes (scripted) |
| Voice history | Talin Dock local storage, per profile | Per command | No | Yes | No | Yes |
| Widget configurations and room layouts | Talin Dock local storage | On edit | No | Yes | No | Yes |
| Scenes | Talin Dock (fixed definitions) | n/a | No | Yes | No | Yes |
| Integration connections | Integration credentials and session state | On connect; status continuous | Cloud routes: yes | Local routes: yes | Cloud routes: yes | Yes |

---

## 12. Operating conditions and failure scenarios

The prototype shows only "Not responding" and "disconnected" states, toggled manually. Everything below is the intended behaviour, derived from the design's principles: Home must not depend on a computer, and not every function needs the internet. Where the prototype represents a behaviour, that is noted.

| Situation | Should continue | Should degrade | Prototype |
|---|---|---|---|
| Internet unavailable | Clock; local-route devices (TV over the local network, Tuya local key, Home Assistant locally); computers over USB or LAN; cached calendar events; widget layouts | Weather shows the last cached value with its age; cloud-route devices (Tuya cloud, SmartThings) show "Not responding"; calendar sync pauses; external voice processing (if used) unavailable | Not represented |
| Home Assistant unavailable | Devices on other routes | Devices routed through HA show "Not responding / Integration disconnected" | Represented (Connections toggle) |
| TV disconnected | Everything else | TV tile, widget and remote show "Not responding"; keys log "TV not responding"; scenes skip the TV | Represented |
| Dehumidifier offline | Everything else | Humidity and temperature widgets, room summary and Ambient show unavailable values; voice says unavailable | Partly represented: the widget shows "Not responding" status, but the humidity number is not replaced by an "unavailable" value in every widget |
| Windows PC switched off | All Home functions; Mac | Computer shows "Disconnected"; auto-reconnect waits | Represented as link loss, not specifically "off" |
| Mac switched off | As above | As above | As above |
| USB cable disconnected | Computer over Wi-Fi if available and auto-reconnect is on | Lower link quality; notice "switched to Wi-Fi" | Represented |
| Wi-Fi connection lost (iPad) | Clock; cached data; USB-connected computer | All network devices "Not responding"; weather and calendar sync stale | Not represented for the iPad's own Wi-Fi |
| Calendar permission denied | Everything else | Calendar widgets and sheet show a "Calendar access is off" state with a path to grant it | Not represented |
| YouTube not installed | Everything else | Launch offers the App Store page | Represented generically (Plex, SoundCloud) |
| Spotify not installed | As above | As above | As above |
| Microphone permission denied | Everything else | Voice shows "Microphone access is off" with a path to grant it; suggestions remain tappable | Not represented |
| Application restarted | (none) | Restores the last screen or Home, active profile, room, layouts, device registry and settings; reconnects integrations; shows stale indicators until fresh data arrives | Not represented (the prototype resets) |
| Device data becomes stale | Last value remains visible | Shows the value's age; marks it stale after a defined threshold; stops using it in scenes and voice answers, or qualifies the answer | Not represented |

---

## 15. Feature prioritisation

The guiding rule from the brief: the first version prioritises a reliable, attractive Home dashboard and working smart-home control.

### MVP (first usable version)

| Feature | Reasoning |
|---|---|
| App shell: sidebar or rail, Home and Settings, landscape and portrait, persistence across restart | Everything depends on it |
| Home dashboard: clock, date, weather (real), room selector, fixed default widget set per room | The core value; must be reliable before it is flexible |
| Device registry with real integrations for the two existing devices: Samsung TV and Tuya dehumidifier | The only devices the household owns; proves the adapter model on two very different routes |
| Dehumidifier: real humidity reading, room summary, Humidity widget, detail with gauge (and trend if history is stored) | Primary sensor; real unit is reading-only |
| TV: power, volume and mute, navigation keys, Back and Home, source, app launch for configured apps, connection status | Key feature; most-used control |
| Capability model with "Readings only / Full control" | Needed to represent the real dehumidifier honestly |
| Calendar read-only: combined agenda and Calendar widget from the iPad's calendar store; per-calendar visibility | Part of the minimal dashboard the owner asked for |
| Media launcher with availability check and store fallback | Low complexity, high daily value |
| Household profile as default, with the two personal profiles for calendar visibility, favourites and theme | The household requirement; the data model must support profiles from the start even if some per-profile settings arrive later |
| Clear unavailable and offline states; prototype disclaimers removed | Trust in a real product |

### Phase 2

| Feature | Reasoning |
|---|---|
| Full widget editing (add, remove, reorder, resize) and This week widget | Valuable but secondary to a working default layout |
| Ambient mode with idle trigger and night dimming | Depends on stable dashboard data |
| Calendar week and month views, event creation, privacy modes (busy only, hidden) | Builds on read-only calendar; write access and privacy need decisions (Q-7, Q-9) |
| Scenes (the four defined), then a scene editor | Needs reliable device commands first |
| Discovery and the add flow for further integrations (Matter, Hue, Tapo, Home Assistant) | Platform growth after the first two integrations work |
| Connection manager for smart-home routes | Operational visibility once more than one route exists |
| Talin Voice basic grammar, push-to-talk | Depends on device control and on the speech-processing decision (Q-14) |

### Phase 3

| Feature | Reasoning |
|---|---|
| Computer mode: companion service, pairing, monitoring, master volume, output switching, media keys, shortcuts | Requires separate software on two platforms; independent of Home |
| Per-application volume mixer | High technical risk on macOS (Q-16) |
| USB transport with automatic fallback to Wi-Fi | Additional transport complexity |
| Display mode hand-off and host check | Depends on third-party software choice; limited control |
| Multiple computers per platform | Household has three machines (Q-17) |

### Future possibilities

- Wake word or always-listening voice.
- Conversational voice and calendar queries by voice.
- Camera live view.
- Automations (time or sensor triggers).
- Additional device types beyond those modelled.
- Remote access from outside the home.
- Phone companion.
- Notifications.
- Per-profile dashboard layouts.

---

## 16. Acceptance criteria

The numeric targets below are proposed starting values for the reviewer to confirm or adjust. They are not derived from the prototype.

### 16.1 Shell and persistence

- After a restart, the app restores the active profile, selected room, every room's layout, the device registry and all settings with no loss.
- Navigating between any two sections preserves the selected room and layout (verifiable by switching through all eight sections).
- Landscape and portrait both render with no clipped controls and with every touch target at least 44 × 44 pt.

### 16.2 Home dashboard

- The clock matches device time to the minute and the date to the day.
- Weather comes from a real service for the configured location. The data's age is visible when it is older than 60 minutes, and the last value is shown when offline.
- Changing room updates the summary line and widgets within 300 ms.
- Every widget has a defined state for "loading", "unavailable" and "not configured". None ever shows simulated numbers.

### 16.3 Devices (general)

- Each device's tile, sheet and widgets reflect its real state within 5 s of a change made elsewhere (for example on the physical remote or the manufacturer app), where the route reports changes.
- A device that stops responding is marked "Not responding" within 30 s, on every surface that shows it.
- Capability switches cannot enable a capability the integration reports as unsupported.
- Removing a device deletes its record from Talin Dock and leaves the physical device untouched.

### 16.4 Samsung TV

- Each remote key produces the matching real action on the TV. Median latency from tap to TV reaction is at most 500 ms on the local route; at most 2 s on a cloud route.
- Power off works from the On state. Power on from standby either works, or the interface clearly states that it is not supported on this route.
- App shortcuts launch the selected app on the TV in at least 95% of attempts.
- The connection state shown matches reality within 30 s.

### 16.5 Dehumidifier

- Humidity shown comes from the real unit, never a simulated value, and displays its age if older than the route's normal interval.
- If the unit reports only humidity, no other control or reading is shown.
- Any control that is shown (power, target, mode) changes the real unit, and the new state is confirmed back from the device.

### 16.6 Calendar

- Events come only from the calendars selected for the active profile, from the accounts on the device.
- Busy-only calendars never reveal a title or location to a non-owner profile.
- An event created in Talin Dock appears in the iPad's own calendar store with the same title, time and calendar, and syncs through that account.
- Calendar permission denied produces a clear state with a path to grant access.

### 16.7 Media

- Selecting YouTube opens the installed YouTube app; selecting Spotify opens the installed Spotify app. Verified on the target iPad.
- An app that is not installed produces the store fallback, never a silent failure.
- Recently used reflects real launches.

### 16.8 Profiles

- Switching profile changes theme, clock format, calendar visibility and favourites within 300 ms, with no login.
- Household is restored after the configured idle period (if the feature ships).
- Shared settings changed in one profile are visible in all others immediately.

### 16.9 Voice

- Push-to-talk captures audio only while held.
- Each supported command executes the real action or gives the defined failure response (absent, unsupported, unavailable, not understood).
- Microphone permission denied produces a clear state.

### 16.10 Computer

- Volume sliders change the real master or application volume on the paired computer. Values read back match within 2%.
- CPU, memory and GPU values match the computer's own monitor within the sampling interval.
- Unplugging USB with Wi-Fi available and auto-reconnect on switches the link within 5 s, with a visible notice.
- A computer that is switched off is shown as disconnected within 30 s. Home functions are unaffected (verifiable with all computers off).

### 16.11 Display

- The interface never claims to extend a desktop itself.
- The hand-off opens the configured display app, or explains why it cannot.

---

## Executive summary

**Scope.** Talin Dock turns a docked iPad Air 2 into a shared household control centre:

- A room-based dashboard: clock, weather, calendars, scenes and resizable widgets.
- Smart-home control built on a per-device capability model.
- A dedicated Samsung TV remote.
- A media launcher that hands off to installed apps.
- Push-to-talk voice.
- Optionally, monitoring and audio control of household computers and a hand-off to third-party second-monitor software.

Two people share one device. A default Household profile requires no login, and lightweight personal profiles change calendars, favourites, theme and preferences.

**What exists.** A complete interactive prototype in which every section, sheet and setting is designed and most controls change simulated state. Notable gaps:

- Settings that are stored but do nothing: idle auto-return, ambient-when-idle, voice options, "Show on Home dashboard".
- Access restrictions that are not enforced.
- Event details, editing and deletion.
- Scene editing.
- Room naming.

**Major dependencies.**

- Samsung TV control route and its real capabilities.
- Tuya route (cloud account versus local key). The real dehumidifier reports humidity only.
- The iPad's calendar store and the accounts signed in on it.
- A weather service.
- Speech processing for Talin Voice.
- A companion service on each computer.
- Third-party display software.
- Media apps' continued support for iPadOS 15.

**Biggest technical challenges.**

- iPadOS 15 and 2 GB RAM limit what can run on the iPad and which apps can be installed.
- Whether integrations, discovery and background polling run on the iPad or on an always-on hub.
- TV power-on from standby and state read-back.
- Per-application volume on macOS.
- USB transport between the iPad and computers.
- Detecting a display host.
- Privacy of personal calendars on an unauthenticated shared device.

**Decide before development.**

1. Where integrations run (iPad versus an always-on hub), and whether Home Assistant is the backbone or one optional route.
2. The TV and dehumidifier routes, after verifying what each device actually exposes.
3. The privacy and authentication stance for personal profiles and calendars.
4. Where speech processing runs, and which languages it supports.
5. Which computers Computer mode must support.
6. The persistence and backup model for configuration.

Full list: `OPEN_QUESTIONS.md`.
