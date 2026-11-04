# Talin Dock: Feature Matrix

Version 1.0 · 4 November 2026 · Companion to `PRODUCT_SPECIFICATION.md`.

**Prototype status labels** (defined in `PRODUCT_SPECIFICATION.md` §0.2):

| Label | Meaning |
|---|---|
| SIM | Interactive; changes simulated state |
| ACK | Acknowledgement or toast only |
| VIS | Visible or stored, with no behaviour |
| COPY | Described in text only |
| ABSENT | Not present |

**Priority**: MVP, P2 (Phase 2), P3 (Phase 3), F (Future). Reasoning is in `PRODUCT_SPECIFICATION.md` §15. **Open questions** refer to `OPEN_QUESTIONS.md`.

## Shell and navigation

| ID | Feature | Purpose | Dependencies | Prototype status | Priority | Open questions |
|---|---|---|---|---|---|---|
| NAV-1 | Sidebar (landscape) / rail (portrait) with 8 sections | Persistent navigation | None | SIM | MVP | |
| NAV-2 | Home / Computer mode selector with accent change | Separate home and computer emphasis | None | SIM | MVP (Home); P3 (Computer) | |
| NAV-3 | Section-driven mode switching | Mode follows section | NAV-2 | SIM | MVP | |
| NAV-4 | State persistence across navigation | Room and layout are not lost | Local storage | SIM (in memory only) | MVP | Q-11 |
| NAV-5 | Persistence across restart | Appliance reliability | Local storage | ABSENT | MVP | Q-11 |
| NAV-6 | Toast acknowledgements | Feedback | None | SIM | MVP | |
| NAV-7 | Appliance mode (full screen, keep awake, relaunch) | Dedicated device | OS capabilities | ABSENT | MVP | Q-2 |
| NAV-8 | First-run setup | Onboarding and permissions | Several | ABSENT | MVP | Q-39 |

## Household and profiles

| ID | Feature | Purpose | Dependencies | Prototype status | Priority | Open questions |
|---|---|---|---|---|---|---|
| HH-1 | Household default profile | Shared use without login | None | SIM | MVP | |
| HH-2 | Personal profiles (Anthony, Bárbara) and switcher | Personal preferences | HH-1 | SIM | MVP | Q-7 |
| HH-3 | Per-profile theme, clock format | Personal preference | HH-2 | SIM | MVP | |
| HH-4 | Per-profile calendar visibility | Personal agenda | CAL-1 | SIM | MVP | |
| HH-5 | Per-profile favourite devices | Personal shortcuts | DEV-1 | SIM | MVP | |
| HH-6 | Per-profile media favourites | Personal shortcuts | MED-1 | SIM (fixed lists) | P2 | |
| HH-7 | Per-profile voice history | Personal context | VOI-1 | SIM | P2 | |
| HH-8 | Idle auto-return to Household | Shared device hygiene | Inactivity timer | VIS + COPY | P2 | Q-22 |
| HH-9 | Personal versus household scope labelling in Settings | Clarity | None | SIM | MVP | |
| HH-10 | Profile protection (PIN or similar) | Privacy | Secure store | ABSENT | Undecided | Q-7 |
| HH-11 | Member management (add, rename, avatar) | Household changes | HH-2 | ABSENT | P2 | Q-34 |
| HH-12 | Device access per member ("Who can use it") | Restriction | DEV-1 | VIS (filters favourites only) | Undecided | Q-8 |

## Home dashboard

| ID | Feature | Purpose | Dependencies | Prototype status | Priority | Open questions |
|---|---|---|---|---|---|---|
| HOME-1 | Clock and date | Core display | Device clock | Real (device time) | MVP | |
| HOME-2 | Header weather and 4-day forecast | Core display | Weather service | SIM (static) | MVP | Q-10 |
| HOME-3 | Room selector | Room context | ROOM-1 | SIM | MVP | Q-24 |
| HOME-4 | Room summary line (humidity, temperature, accessory count) | At-a-glance status | DEV, sensors | SIM | MVP | |
| HOME-5 | Profile chip | Profile awareness | HH-2 | SIM | MVP | |
| HOME-6 | Scenes row (4 fixed) | One-tap actions | SCN-1 | SIM | P2 | Q-26 |
| HOME-7 | Widget grid per room | Configurable dashboard | WID-* | SIM | MVP (default layout); P2 (editing) | Q-20 |
| HOME-8 | Ambient mode (manual) | Distance-readable view | HOME-1, -2, CAL, sensors | SIM | P2 | |
| HOME-9 | Ambient mode on idle | Appliance behaviour | Timer | VIS | P2 | Q-23 |

## Widgets

| ID | Feature | Purpose | Dependencies | Prototype status | Priority | Open questions |
|---|---|---|---|---|---|---|
| WID-1 | Calendar widget (S/W/L) | Next events | CAL-1 | SIM | MVP | |
| WID-2 | This week widget (W/L) | 7-day overview | CAL-1 | SIM | P2 | |
| WID-3 | Weather widget (S/W) | Forecast | Weather | SIM (static) | MVP | Q-10 |
| WID-4 | Humidity widget (S/W) | Sensor reading | DEH-1 | SIM | MVP | Q-29 |
| WID-5 | Temperature widget (S/W) | Sensor reading | Temperature-capable device | SIM | P2 | Q-29 |
| WID-6 | TV widget (S/W) | Quick TV control | TV-1 | SIM | MVP | |
| WID-7 | Dehumidifier widget (S/W/L) | Device status and control | DEH-* | SIM | MVP (reading); P2 (controls) | Q-3 |
| WID-8 | Media widget (S/W) | Quick app launch | MED-1 | SIM | P2 | Q-19 |
| WID-9 | Favourites widget (W/L) | Personal device shortcuts | HH-5 | SIM | P2 | Q-40 |
| WID-10 | Quick actions widget (S/W, fixed) | Shortcuts | NAV | SIM | P2 | |
| WID-11 | Edit mode: move, resize, remove, add | Customisation | Layout storage | SIM | P2 | Q-20 |
| WID-12 | Per-type on/off in Settings | Customisation | WID-11 | SIM | P2 | |
| WID-13 | Per-widget settings (source selection) | Precision | WID model | ABSENT | P2 | Q-29 |
| WID-14 | Loading, stale and unavailable states | Trust | RT timestamps | Partial (missing-device states only) | MVP | Q-31 |

## Calendar

| ID | Feature | Purpose | Dependencies | Prototype status | Priority | Open questions |
|---|---|---|---|---|---|---|
| CAL-1 | Read calendars from the OS calendar store | Data source | Calendar permission | SIM | MVP | Q-9 |
| CAL-2 | Combined agenda (60 days) | Overview | CAL-1 | SIM | MVP | |
| CAL-3 | Next-appointment card | At a glance | CAL-1 | SIM | MVP | |
| CAL-4 | Per-calendar visibility | Filtering | HH-4 | SIM | MVP | |
| CAL-5 | Filter capsules | Filtering | CAL-1 | SIM | P2 | |
| CAL-6 | Week view | Planning | CAL-1 | SIM | P2 | |
| CAL-7 | Month view with weekday lookup | Planning | CAL-1 | SIM | P2 | |
| CAL-8 | New event form (title, location, calendar, all-day, date, start, duration) | Creation | Calendar write access | SIM | P2 | Q-9 |
| CAL-9 | Writable-calendar rules by profile | Ownership | HH-2 | SIM | P2 | Q-7 |
| CAL-10 | Privacy: full, busy only, hidden (owner-set) | Privacy | HH-2 | SIM | P2 | Q-7, Q-9 |
| CAL-11 | Event details, edit, delete | Management | CAL-8 | ABSENT | P2 | Q-27 |
| CAL-12 | Recurrence, invitations, multi-day | Completeness | CAL-1 | ABSENT | P2 | Q-27 |
| CAL-13 | Permission-denied state | Robustness | CAL-1 | ABSENT | MVP | |

## Devices (general)

| ID | Feature | Purpose | Dependencies | Prototype status | Priority | Open questions |
|---|---|---|---|---|---|---|
| DEV-1 | Device registry grouped by room | Overview | Storage | SIM | MVP | |
| DEV-2 | Category filter | Navigation | DEV-1 | SIM | P2 | |
| DEV-3 | Tile power toggle and status text | Quick control | Adapters | SIM | MVP | |
| DEV-4 | Accessory sheet (controls, readings) | Detail control | Adapters | SIM | MVP | |
| DEV-5 | Capability switches and presets | Honest device representation | Adapter capability reporting | SIM (unbounded) | MVP | Q-4 |
| DEV-6 | Connection route picker | Choice of integration | Adapters | SIM (no re-pairing) | P2 | Q-1 |
| DEV-7 | Name and room editing | Organisation | DEV-1 | SIM | MVP | |
| DEV-8 | Show on Home dashboard | Dashboard control | WID | VIS | Undecided | Q-35 |
| DEV-9 | Remove with confirmation | Management | DEV-1 | SIM | MVP | |
| DEV-10 | Restore removed devices | Recovery | DEV-9 | SIM (empty state only) | P2 | Q-36 |
| DEV-11 | Add flow (type, route, capabilities, name and room) | Setup | Adapters | SIM (no pairing) | P2 (MVP needs pairing for the two devices) | |
| DEV-12 | Route-specific pairing step | Real setup | Adapters | ABSENT | MVP | Q-5, Q-6 |
| DEV-13 | Discovery | Setup | Adapters, local network | SIM (fixed list) | P2 | |
| DEV-14 | Not-responding and integration-disconnected states | Reliability | Reachability | SIM (manual) | MVP | Q-31 |
| DEV-15 | Simulate connection loss | Prototype tool only | n/a | SIM | Remove | |
| DEV-16 | Additional types: light, plug, sensor, air conditioner, camera | Growth | Adapters | SIM (placeholder values) | P2 / F | Q-29 |

## Samsung TV

| ID | Feature | Purpose | Dependencies | Prototype status | Priority | Open questions |
|---|---|---|---|---|---|---|
| TV-1 | Power on/off | Basic control | TV route | SIM | MVP | Q-5 |
| TV-2 | Navigation pad, OK, Back, Home | Navigation | TV route | SIM (logged) | MVP | Q-5 |
| TV-3 | Volume ±, mute, volume overlay | Audio | TV route | SIM | MVP | Q-5 |
| TV-4 | Channel ± | Live TV | TV route, tuner use | SIM | P2 | Q-5 |
| TV-5 | Play/Pause, Previous, Next | Playback | TV route | SIM (partly logged) | MVP | |
| TV-6 | Source cycle and direct source selection | Inputs | TV route | SIM | MVP | Q-5 |
| TV-7 | App launch on the TV (configurable list) | Apps | TV route, app identifiers | SIM (sample list) | MVP | Q-5 |
| TV-8 | Status: power, source, volume, connection, screen preview | Feedback | State read-back | SIM | MVP | Q-5 |
| TV-9 | Capability gating of keys | Honest representation | DEV-5 | SIM | MVP | |
| TV-10 | Read the TV's installed app list | Accuracy | TV route | COPY | P2 | Q-5 |
| TV-11 | Text input or pointer mode | Search fields | TV route | ABSENT | F | |

## Dehumidifier

| ID | Feature | Purpose | Dependencies | Prototype status | Priority | Open questions |
|---|---|---|---|---|---|---|
| DEH-1 | Humidity reading | Core sensor | Tuya route | SIM | MVP | Q-6 |
| DEH-2 | Gauge and comfort band | Readability | DEH-1 | SIM | MVP | |
| DEH-3 | 12-hour trend | History | History storage | SIM (seeded) | P2 | Q-28 |
| DEH-4 | Temperature reading | Sensor | Model support | SIM | Depends on unit | Q-3 |
| DEH-5 | Power control | Control | Model and route | SIM | Depends on unit | Q-3 |
| DEH-6 | Target humidity (35–70%, 5% steps) | Control | Model and route | SIM (placeholder range) | Depends on unit | Q-3 |
| DEH-7 | Operating modes (Auto, Continuous, Sleep, Laundry) | Control | Model and route | SIM (placeholder modes) | Depends on unit | Q-3 |
| DEH-8 | Water tank status | Sensor | Model support | SIM (as %) | Depends on unit | Q-3 |

## Scenes

| ID | Feature | Purpose | Dependencies | Prototype status | Priority | Open questions |
|---|---|---|---|---|---|---|
| SCN-1 | Four fixed scenes with capability-aware execution | One-tap routines | Adapters | SIM | P2 | |
| SCN-2 | Scene editor | Customisation | SCN-1 | ABSENT | P2 | Q-26 |
| SCN-3 | Automations (time or sensor triggers) | Automation | Background execution | ABSENT | F | Q-1 |

## Voice

| ID | Feature | Purpose | Dependencies | Prototype status | Priority | Open questions |
|---|---|---|---|---|---|---|
| VOI-1 | Push-to-talk with listening and processing states | Voice input | Microphone | SIM (scripted rotation) | P2 | Q-14 |
| VOI-2 | Six commands with capability-aware responses | Basic control | Registry | SIM | P2 | |
| VOI-3 | Suggestions and recent-command re-run | Discoverability | VOI-1 | SIM | P2 | |
| VOI-4 | Voice settings (spoken responses, hold to talk, transcript, language) | Preference | VOI-1 | VIS | P2 | Q-14, Q-38 |
| VOI-5 | Free-form or conversational commands | Advanced | Speech and intent service | ABSENT | F | Q-14 |
| VOI-6 | Wake word | Hands-free | Always-on audio | ABSENT | F | |
| VOI-7 | Microphone permission-denied state | Robustness | VOI-1 | ABSENT | P2 | |

## Media

| ID | Feature | Purpose | Dependencies | Prototype status | Priority | Open questions |
|---|---|---|---|---|---|---|
| MED-1 | App grid launching installed iPad apps | Launcher | App links | SIM (no real launch) | MVP | Q-13 |
| MED-2 | Not-installed fallback to store page | Robustness | Availability check | SIM / ACK | MVP | Q-13 |
| MED-3 | Show/hide apps (Edit, Settings › App shortcuts) | Configuration | MED-1 | SIM | MVP | |
| MED-4 | Favourite shortcuts with deep links | Speed | Per-app deep links | SIM (app only, fixed lists) | P2 | |
| MED-5 | Recently used | Convenience | Launch history | SIM | P2 | |
| MED-6 | Return to Talin Dock after launch | Appliance flow | OS behaviour | ABSENT | MVP | Q-25 |

## Computer mode

| ID | Feature | Purpose | Dependencies | Prototype status | Priority | Open questions |
|---|---|---|---|---|---|---|
| PC-1 | Windows PC / Mac selector | Target selection | PC pairing | SIM | P3 | Q-17 |
| PC-2 | Status chips: USB, Wi-Fi, quality, auto-reconnect | Connection visibility | Transport | SIM (fixed quality) | P3 | Q-15 |
| PC-3 | CPU, memory, GPU metrics with sparklines | Monitoring | Companion | SIM (random) | P3 | |
| PC-4 | Master volume and mute | Audio | Companion | SIM | P3 | |
| PC-5 | Per-application mixer | Audio | Companion; macOS audio component | SIM (fixed apps) | P3 | Q-16 |
| PC-6 | Output device selection | Audio | Companion | SIM | P3 | |
| PC-7 | Media playback controls | Media | Companion | SIM / ACK | P3 | |
| PC-8 | System shortcuts (6 per platform) | Control | Companion | ACK | P3 | |
| PC-9 | Pairing (code-based) | Trust | Companion | COPY | P3 | Q-18 |
| PC-10 | Link fallback and auto-reconnect | Reliability | Transport | SIM | P3 | Q-15 |
| PC-11 | Multiple computers per platform | Household fit | PC-1 | ABSENT | P3 | Q-17 |

## Display mode

| ID | Feature | Purpose | Dependencies | Prototype status | Priority | Open questions |
|---|---|---|---|---|---|---|
| DSP-1 | Setup guidance per platform (USB or Wi-Fi) | Guidance | None | SIM | P3 | |
| DSP-2 | Host check | Status | Third-party software | SIM (always fails) | P3 | Q-12 |
| DSP-3 | Hand-off to the display app | Launch | Third-party software | COPY | P3 | Q-12, Q-13 |

## Settings and connections

| ID | Feature | Purpose | Dependencies | Prototype status | Priority | Open questions |
|---|---|---|---|---|---|---|
| SET-1 | Personal: Profile, Calendars, Theme & display, Talin Voice | Personal configuration | HH-2 | SIM (voice and idle items VIS) | MVP / P2 | |
| SET-2 | Household: Members | Profile switching | HH-2 | SIM (switch only) | MVP | Q-34 |
| SET-3 | Rooms: add from a fixed list, delete empty | Room management | ROOM-1 | SIM | MVP | Q-33 |
| SET-4 | Dashboards & widgets | Layout | WID | SIM | P2 | |
| SET-5 | Device integrations (read-only) | Overview | Adapters | VIS | P2 | |
| SET-6 | Connections: Home Assistant, Samsung TV, Tuya (connect/disconnect) | Operations | Adapters | SIM | P2 | Q-1 |
| SET-7 | Connections: computers (USB, Wi-Fi, preferred, auto-reconnect, pair) | Operations | PC | SIM | P3 | Q-15 |
| SET-8 | App shortcuts: media and TV lists | Configuration | MED, TV | SIM | MVP | |
| SET-9 | About / prototype disclaimer | Honesty | None | SIM | Remove for product | |
| ROOM-1 | Rooms as household entities, one layout each | Structure | Storage | SIM | MVP | Q-21, Q-24 |
