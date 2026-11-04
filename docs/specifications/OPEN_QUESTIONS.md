# Talin Dock: Open Questions, Gaps and Uncertainties

Version 1.0 · 4 November 2026 · Companion to `PRODUCT_SPECIFICATION.md`.

Questions are numbered Q-1 to Q-40 and grouped by impact:

- **P0: architecture-shaping.** Answer these before any technology choice.
- **P1: implementation-shaping.** Answer before building the affected feature.
- **P2: detail and UX.** Answer during design of the affected screen.

Nothing below has been decided. Where the prototype implies an answer, it is stated as an implication, not a decision.

---

## Part A. Prioritised questions

### P0: architecture-shaping

**Q-1. Where do integrations, discovery and background work run?**

The prototype presents everything as if the iPad does it. The brief states the iPad must not be assumed to host every service.

The options are:
- The iPad alone.
- An always-on hub on the home network, with the iPad as a display and control surface.
- A hybrid.

A related question: is Home Assistant the backbone through which all devices are reached, or one optional route among others, as the prototype shows it?

*Why it matters*: this decides:
- Background polling while the app is not frontmost.
- Humidity history collection.
- Behaviour after an iPad restart.
- Discovery on the local network.
- Credential storage.
- The load on a 2 GB RAM device.
- Whether other clients (phones) could ever join.

**Q-2. What does "dedicated appliance" mean operationally?**

Undecided:
- Is the app expected to stay frontmost permanently (kiosk-style lock)?
- Should it relaunch automatically after an iPad restart or crash?
- Should the screen stay on, and is it always on charge?
- Who can leave the app?

*Why it matters*: determines dependence on operating-system features for single-app or kiosk use, on power management, and on whether background execution is needed at all.

**Q-3. The real dehumidifier reports humidity only, but the prototype defaults to full control.**

The product owner stated the household's unit exposes no controls. The current prototype defaults all six capabilities on, so the full detail screen can be reviewed.

Open:
- Confirm the real unit's data points through the chosen route (humidity only, or also temperature, tank and power?).
- Decide whether full-control screens are built now or later.

*Why it matters*: it defines the MVP scope for the device the product is built around, and whether target, mode and tank UI ship at all.

**Q-4. Are capabilities reported by the integration, chosen by the user, or both?**

In the prototype the user can switch any capability on, including ones the device cannot support.

Implied rule: the integration reports what is supported, and the user may only hide.

*Why it matters*: it drives the device data model, the adapter contract and error handling for commands the device rejects.

**Q-5. Samsung TV: which control route, and what does it really support on UE43U8000F?**

Unverified:
- Power-on from standby (may need network standby enabled or a separate wake mechanism).
- Read-back of current input, foreground app and volume.
- Direct input selection versus cycling.
- Listing installed apps, including the sideloaded Moonlight.
- Channel keys without a tuner in use.
- The pairing prompt and token persistence for local control.

*Why it matters*: the Remote is a key feature. Status display and several keys may not be achievable on one route, and the TV status card assumes read-back exists.

**Q-6. Tuya / Smart Life: cloud account or local key?**

A cloud route requires an account link and internet access. A local route requires obtaining the device's local key. Either may expose different data points and update intervals.

*Why it matters*: internet dependency, update latency, stale-data rules, credential handling, and whether humidity is visible offline.

**Q-7. Do personal profiles need any protection?**

The design has no authentication. Anyone can switch to any profile, see that person's full calendar, and change that person's calendar privacy (the owner-only rule is enforced only by which profile is active).

Options: none (as designed); a PIN for personal profiles only; a PIN only for privacy and account settings.

*Why it matters*: whether credentials or a secure store are needed; how strong the privacy promise "Busy only" really is.

**Q-8. Should "Who can use it" restrict control?**

Today it only filters personal favourites.

*Why it matters*: if it should restrict control, every control surface, scene, voice command and widget needs permission checks, and the Household profile's rights must be defined.

**Q-9. Whose calendar accounts are on the shared iPad, and what does that expose?**

If both people's personal accounts are signed in on the iPad, their calendars, and possibly mail and contacts, are reachable through the iPad's own apps regardless of Talin Dock's privacy settings.

Alternative: share each personal calendar into a single household account.

*Why it matters*: decides the calendar data source, the meaning of "privacy" in Talin Dock, and whether write access to personal calendars is acceptable from a shared device.

**Q-10. Weather: which source and which location?**

The location is not specified anywhere. The prototype uses fixed sample data.

*Why it matters*: an external dependency, possibly a key or account, caching and offline behaviour, and units.

**Q-11. Persistence, backup and editing of configuration.**

Unspecified:
- Where profiles, rooms, layouts, the device registry, scenes and history are stored.
- Whether they are backed up.
- Whether they can be restored to a replacement iPad.
- Whether they can be edited from another device.

*Why it matters*: the data model and storage location (linked to Q-1); recovery after a reset.

**Q-12. Display mode: can Talin Dock detect a display host, or only launch the display app?**

The prototype's "Check for Display Host" assumes some form of detection.

*Why it matters*: it may reduce Display mode to guidance plus an app launch, and changes what "connected" can mean on that screen.

**Q-13. Do the target apps still install and run on iPadOS 15?**

This covers YouTube, Spotify, Netflix, Prime Video, Disney+, RTÉ Player, display software and any companion client. Current app versions often require newer iPadOS releases.

*Why it matters*: the media launcher's value on this hardware, and fallback behaviour when an app is absent because it cannot be installed at all.

**Q-14. Where does speech recognition and command interpretation run, and in which languages?**

The options are on the iPad, on a local server or computer, or in an external service. The prototype stores English (Ireland), English (UK) and Português (Brasil) per profile; Bárbara's profile defaults to Portuguese.

*Why it matters*:
- Offline voice.
- Privacy of household audio.
- Latency on an iPad Air 2.
- Whether a computer or hub must be on for voice to work.

### P1: implementation-shaping

**Q-15. Is a USB link between the iPad and a computer feasible for companion data?**

The prototype assumes USB and Wi-Fi links with automatic fallback.

*Why it matters*: USB transport between an iPad and Windows or macOS may require platform-specific drivers or services. If infeasible, the USB chips, preferences and acceptance criteria change.

**Q-16. Per-application volume on macOS.**

macOS does not natively offer per-app volume control.

*Why it matters*: a mixer on the Mac may need an additional audio component installed by the user, or must be reduced to master volume only.

**Q-17. Which computers must Computer mode support?**

The household has a Windows desktop, a Windows laptop and a MacBook Pro. The prototype supports one Windows PC and one Mac.

*Why it matters*: the pairing model (list versus fixed slots), the selector UI, and naming.

**Q-18. Companion pairing and trust.**

The prototype mentions "the code shown here" but shows no code. Undecided: how pairing is verified, how it is revoked (Unpair), and how traffic on the local network is protected.

*Why it matters*: security of a service that can lock, sleep and change audio on the computer.

**Q-19. Two launch targets with the same app names.**

Media and the Media widget open apps on the iPad. The Remote's Apps card, the TV widget and the voice command "Open YouTube on the TV" open apps on the TV.

*Why it matters*: users may expect one and get the other. Labels, icons or grouping may need to make the target explicit.

**Q-20. Widget order versus dense packing.**

"Move earlier/later" changes list order, but dense packing can place a widget elsewhere visually when sizes differ.

*Why it matters*: the layout model. Decide whether it is an ordered list with packing or explicit grid positions, and which layout survives orientation changes.

**Q-21. Should layouts, scenes or quick actions differ per profile?**

Layouts are per room and shared by everyone. Scenes and quick actions are fixed.

*Why it matters*: the data model for layouts and scenes.

**Q-22. Idle auto-return to Household.**

Described as 10 minutes in copy, with an on/off switch, and not implemented.

Undecided: whether the timeout is configurable, what counts as activity, and whether it also applies when Ambient mode is showing.

*Why it matters*: requires an inactivity timer and a definition of "use".

**Q-23. Ambient mode triggers and dimming.**

"Ambient mode when idle" is stored but unused. Night dimming appeared in an earlier iteration and was dropped.

*Why it matters*: timers, brightness control, and possibly a light or time-of-day policy.

**Q-24. Does the iPad know which room it is in?**

The prototype treats the room as a manual selection.

*Why it matters*: if the iPad moves between rooms, a default room per placement may be wanted. That affects scenes and voice ("the humidity here").

**Q-25. Returning to Talin Dock after launching an app.**

Not designed.

*Why it matters*: for an appliance-style device, how the user gets back affects whether kiosk-style locking is compatible with launching other apps at all (linked to Q-2).

**Q-26. Scene editing, scheduling and triggers.**

Four fixed scenes; no editor; no automation.

*Why it matters*: scene data model and an execution engine (and where it runs, Q-1).

**Q-27. Event details, editing, deletion, recurrence and invitations.**

None are designed. Tapping an event does nothing.

*Why it matters*: the scope of calendar write access.

**Q-28. Humidity history: who stores it, and for how long?**

The 12-hour trend needs stored readings.

*Why it matters*: needs continuous collection even when the dashboard is not on screen (linked to Q-1).

**Q-29. Multiple sensors per room and sensor selection.**

Humidity and Temperature widgets read only from the dehumidifier. Sensor-type devices are not wired in.

*Why it matters*: widget configuration model (which sensor), room aggregation rules.

**Q-30. Credential storage for cloud routes and companions.**

Which credentials exist (cloud account tokens, local keys, TV pairing tokens, companion pairing keys), where they are stored, and how they are rotated or revoked.

*Why it matters*: secure storage requirements and recovery after reset.

**Q-31. Stale-data thresholds and the "last updated" display.**

Undefined per data type.

*Why it matters*: every widget's unavailable and stale states, voice answers and scene behaviour depend on it.

**Q-32. Notifications and alerts.**

Examples: tank full, device offline, upcoming event. None are designed.

*Why it matters*: background execution and whether Talin Dock alerts beyond its own screen.

### P2: detail and UX

**Q-33. Room naming and renaming.**
Rooms come from a fixed list of names and cannot be renamed. *Why it matters*: room management UI.

**Q-34. Member management.**
Members are fixed (Household, Anthony, Bárbara). No adding, removing, renaming or avatars. Guest use is not considered. *Why it matters*: profile data model.

**Q-35. "Show on Home dashboard".**
Stored but unused, because Home has no accessory grid in this version. Should it control the Favourites widget, a future accessory widget, or be removed? *Why it matters*: avoids a dead setting.

**Q-36. Restoring a single removed device.**
Only possible from the Devices empty state. *Why it matters*: recovery from accidental removal.

**Q-37. Adding a second TV or dehumidifier.**
In the prototype these share one simulated state. *Why it matters*: confirms that the real model must be instance-based. The Remote and widgets then need a device picker.

**Q-38. UI language.**
The UI is English only; voice language is configurable per profile. Should the UI support Portuguese per profile? *Why it matters*: localisation scope.

**Q-39. First-run setup.**
Not designed: location, calendar permission, members, first devices, the companion offer. *Why it matters*: onboarding flow and permission timing.

**Q-40. Large Favourites widget capacity.**
It allows up to 6 tiles in a 2 × 2 widget, which can clip. *Why it matters*: widget content rules.

---

## Part B. Gaps by category

### B1. Visually represented but not functionally specified

| Item | Where | Note |
|---|---|---|
| Return to Household when idle | Settings › Profile | Switch only; no timer (Q-22) |
| Ambient mode when idle | Settings › Theme & display | Stored only (Q-23) |
| Spoken responses, Hold to talk, Show transcript | Settings › Talin Voice | Stored only |
| Voice language | Settings › Talin Voice | Stored only (Q-14, Q-38) |
| Show on Home dashboard | Accessory sheet | Unused (Q-35) |
| Who can use it | Accessory sheet | Filters favourites only (Q-8) |
| Connection quality values | Computer, Connections | Fixed text per link type |
| Device integrations page | Settings | Read-only counts; no setup actions |
| Humidity trend | Dehumidifier sheet | Seeded data (Q-28) |
| Weather | Home, widgets, Ambient | Static |
| Camera "Live view" and "Last motion" | Accessory sheet | Acknowledgement and fixed text |
| Sensor, plug energy values | Accessory sheet, tiles | Fixed values |
| CPU and GPU temperatures | Computer | Derived from load, not measured |
| Computer playback card title | Computer | Static "Evening Focus Mix" |
| Media favourite deep links | Media | Launch the app only |

### B2. Controls without defined real behaviour

| Control | Prototype result |
|---|---|
| Remote: Up/Down/Left/Right/OK, Previous/Next | Logged only |
| Computer: Previous / Next | Toast |
| Computer: all six shortcuts | Toast |
| Media: View in App Store | Toast |
| Camera: Live view › Open | Toast |
| Display: Check for Display Host | Always "No display host found" |
| Voice microphone | Runs the next scripted command, not what was said |
| Dehumidifier "Tank emptied · Reset" | Prototype-only action; real units report the tank state themselves |
| Capability preset "Custom" | State indicator only; cannot be selected |

### B3. Missing user journeys

- First-run setup and permissions (Q-39).
- Integration pairing for every route (Samsung, SmartThings, Tuya cloud, Tuya local, Home Assistant, Matter, Hue, Tapo).
- Companion installation and pairing-code confirmation (Q-18).
- Event details, edit and delete (Q-27).
- Scene creation and editing (Q-26).
- Member management (Q-34).
- Recovery: re-pairing after token loss; restoring configuration on a new iPad (Q-11).
- Returning from a launched app or a display session (Q-25, Q-12).
- Permission denied states: calendar, microphone, local network.

### B4. Conflicting or inconsistent design decisions

| Conflict | Detail |
|---|---|
| Dehumidifier capability default vs reality | Q-3 |
| "Devices appear connected" vs "clearly indicate devices are not connected" | Earlier feedback asked that devices look connected. The final brief asks to make clear that real devices are not connected. The prototype resolves it with a sidebar footnote, an About note and "simulated" labels in calendar sources and toasts, while tiles say "Connected". |
| Privacy promise vs no authentication | "Busy only" can be bypassed by switching profile (Q-7) |
| Launch targets | Same app names on the iPad and the TV (Q-19) |
| Home has no accessory grid but devices have "Show on Home" | Q-35 |
| Humidity widget in rooms without a sensor | Shows the dehumidifier's reading labelled with its own room, which may read as "this room" |
| One Windows PC and one Mac vs three household computers | Q-17 |

### B5. Features likely to be technically difficult

- TV power-on from standby and state read-back (Q-5).
- Per-app volume on macOS (Q-16).
- iPad to computer USB transport (Q-15).
- Continuous background collection on the iPad (history, alerts) (Q-1, Q-28).
- Kiosk-style operation combined with launching other apps (Q-2, Q-25).
- Voice recognition quality and latency on 2014-era hardware, especially bilingual (Q-14).
- Detecting third-party display hosts (Q-12).
- App availability on iPadOS 15 (Q-13).

### B6. Dependencies not yet considered in the design

- Local network permission on the iPad for discovery and local control.
- Time synchronisation and time-zone handling for calendars.
- Rate limits and terms of cloud APIs (Tuya, SmartThings, weather).
- The display software's licence and cost.
- Battery and charging behaviour of a permanently docked iPad. An always-on display increases power draw and heat.
- Accessibility: Dynamic Type, VoiceOver labels exist in the prototype markup, reduced motion.

---

## Part C. Decisions required before implementation (ordered)

1. Q-1: where integrations and background work run; the role of Home Assistant.
2. Q-2: appliance behaviour: kiosk, auto-relaunch, power.
3. Q-5 and Q-6: TV and dehumidifier routes, after hands-on verification of what each device exposes.
4. Q-3 and Q-4: the capability model contract; the MVP dehumidifier scope.
5. Q-7 and Q-9: the privacy and authentication stance; which calendar accounts live on the iPad.
6. Q-11 and Q-30: persistence, backup and credential storage.
7. Q-13: app compatibility on iPadOS 15. This may change the Media scope.
8. Q-14: voice processing location and languages, before Phase 2 voice work.
9. Q-15 to Q-18: computer transport, mixer feasibility, supported machines and pairing, before Phase 3.
