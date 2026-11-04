# Talin Dock: User Flows

Version 1.0 · 4 November 2026 · Companion to `PRODUCT_SPECIFICATION.md` (status labels SIM / ACK / VIS / COPY / ABSENT are defined there in §0.2).

Each flow has three parts:

- **Steps**, as they work in the prototype.
- **Expected behaviour**, which is what should happen in a real implementation.
- **Gaps**, which are not defined by the prototype.

Screen and control names match the prototype exactly.

---

## 1. Opening the Home dashboard

**Steps**

1. The app opens on **Home** in Home mode, with a blue accent. The active profile is **Household** and the selected room is **Desk**.
2. The header shows the date, the large clock and a room summary line ("Desk · 1 accessory"). It also shows the current weather with a 4-day forecast, the profile chip ("Household") and an **Ambient** button.
3. Below the header are the room selector, the four scene buttons and the Desk widget grid. Desk holds Calendar (large), TV (small), Humidity (small) and This week (wide).

**Expected behaviour**

- The app opens directly into Home, with no splash screen or login. After a restart it returns to the last profile and room, or to Household if idle auto-return is enabled.
- Values appear from cache immediately and refresh in the background. Anything older than its freshness threshold shows its age.
- The device is meant to stay on Home all day. Ambient mode may take over after inactivity, if enabled.

**Gaps**

- First-run setup is not designed: choosing a location for weather, granting calendar access, adding members, and adding the first devices.
- No loading or empty-data states exist.

## 2. Changing rooms

**Steps**

1. Tap **Kitchen** in the room selector on Home.
2. The summary line updates ("Kitchen · 0 accessories"). The grid switches to Kitchen's layout: Calendar (wide), Weather (wide), Temperature (small), Quick actions (small), Media (wide).
3. Tap **Bedroom**. The summary adds "62% humidity · 19.4 °C", because the dehumidifier is in Bedroom. The grid shows Dehumidifier (large), Humidity, Temperature, TV and Quick actions.

**Expected behaviour**

- The room is a persistent selection. It survives navigation and, presumably, restarts.
- Each room keeps its own widget layout, shared by all profiles.
- Room-scoped readings come only from devices assigned to that room.
- The room selection also scopes the "Accessories in {room}" list in dashboard editing. Device-wide views, such as Devices and Remote, are not filtered by room.

**Gaps**

- It is undecided whether the iPad should know which room it is physically in (one device moved between rooms) and default to it (Q-24).
- No per-room scenes exist.

## 3. Switching between household profiles

**Steps**

1. Tap the profile chip in the Home header, or the profile button at the bottom of the sidebar.
2. The **Who's using Talin Dock?** sheet lists Household, Anthony and Bárbara.
3. Tap **Bárbara**. The sheet closes and a toast reads "Switched to Bárbara".
4. Immediately:
   - The theme changes to Slate.
   - Calendar widgets drop Anthony's personal events, because Bárbara's profile hides that calendar by default.
   - Bárbara's own events show in full.
   - The Favourites widget and Ambient show only her favourites (Dehumidifier).
   - Media favourites change to her shortcuts.
   - Voice history shows her commands.
   - New events can go to her calendar or Household.
5. Switch back by the same route, or with Settings › Members.

**Expected behaviour**

- No login or passcode. A personal profile returns to Household after 10 minutes of inactivity, if "Return to Household when idle" is on.
- Shared settings (rooms, layouts, devices, connections) do not change with the profile.

**Gaps**

- The idle return is not implemented; it exists as text and a switch only.
- No protection for personal profiles, no guest profile, no member management (Q-7, Q-22).

## 4. Viewing and filtering calendars

**Steps**

1. On Home, tap the **Calendar** widget header to open the Calendar sheet in **Agenda** view. Alternatively, tap the **This week** header (Week view) or a day in its strip (Week view with that day selected).
2. The left column shows the **Next** event card and the calendar list. The list shows Anthony, Bárbara and Household, each with a colour, a sharing description and a visibility switch.
3. Switch a calendar off. Its events disappear from every view, widget and Ambient, for the active profile only.
4. Use the **filter capsules** (All, Household, Anthony, Bárbara) to narrow only the right-hand view.
5. Switch to **Week**: Monday to Sunday columns. Use the arrows to move week by week, or **Today** to return. Tap a day header to select it.
6. Switch to **Month**: tap any date to see that day's events below, and confirm its weekday. Use the arrows to move month by month.
7. From Household or Anthony's profile, Bárbara's events appear as "Busy", because her calendar is set to Busy only.

**Expected behaviour**

- Events come from the calendars available on the iPad through the operating system, including the accounts each person has added to the device.
- Visibility is a per-profile preference. Privacy is the owner's choice and applies to everyone else.
- Busy-only events never reveal their title or location to a non-owner.

**Gaps**

- Tapping an event does nothing: no details, editing or deletion.
- Recurring events, invitations, multi-day events and time zones are not represented.
- No state is designed for calendar permission being denied.

## 5. Adding or managing devices

**Adding: steps**

1. Open **Devices** and tap **+**. Alternatively, tap **Discover**, wait for **Found nearby**, and tap **Add** on a candidate; this skips to step 4 below.
2. **Step 1: What are you adding?** Pick a type (TV, Dehumidifier, Light, Smart plug, Sensor, Air conditioner, Camera), then **Next**.
3. **Step 2: How does it connect?** Pick a route. The first is marked Recommended.
4. **Step 3: What can it do?** Switch capabilities on or off; all start on.
5. **Step 4: Name and room.** Edit the name and choose a room, then **Add**.
6. "Connecting… Through {route}" appears, then "{Name} Added". **Done** returns to Devices, where the new tile appears in its room.

**Managing: steps**

1. In **Devices**, filter by category if needed. Tap a tile's icon to toggle power, or the tile body to open its **Accessory** sheet.
2. Change the name, room, route, capabilities, "Who can use it", "Show on Home dashboard" or Favourite.
3. **Remove Accessory** asks for confirmation, then removes the device for everyone.

**Expected behaviour**

- A pairing or authorisation step happens between choosing the route and choosing capabilities. The integration then reports the device's real capabilities, which pre-fill step 3. The user can only reduce them.
- Discovery shows only devices not yet added.
- Removal deletes Talin Dock's record without resetting the device.

**Gaps**

- The pairing step itself is not designed.
- Duplicate detection is not designed.
- Recovery when pairing fails is not designed.
- "Show on Home dashboard" and access restriction have no effect.
- Restoring a single removed device is possible only through the empty state.

## 6. Controlling the Samsung TV

**Steps**

1. Open **Remote**, or tap the TV widget header on Home, or **Open Remote** in the TV's Accessory sheet.
2. The status card shows the connection ("Connected · Samsung TV, local network"), a screen preview, and Power, Source and Volume.
3. Press **Power**. The TV turns on and the preview shows "Channel 1 · Live TV".
4. Use the navigation pad, OK, Back and Home. Home shows "Smart Hub"; Back from an app returns to Smart Hub.
5. Use the volume rocker or Mute. A volume bar overlays the preview for 1.5 s.
6. Use **Source**, which cycles inputs, or tap a source capsule (TV, HDMI 1–3, USB).
7. Tap an app in **Apps**. The TV shows that app.
8. **Edit** on Apps shows or hides app shortcuts.
9. The monospace line at the bottom of the remote shows the last command sent.

**Expected behaviour**

- Each key sends the corresponding command to the real TV, using the local route where possible.
- The status (power, source, app, volume) reflects what the TV reports.
- Keys whose capability is off, or that the route does not support, are visibly disabled and explain why.
- With the TV off, only Power is active.

**Gaps**

- Power-on from standby is unconfirmed (Q-5).
- Reading the current app, input and volume back from the TV is unconfirmed.
- The TV app list is a sample; it is not read from the TV.
- No keyboard or text input for TV search fields.
- No pointer or touchpad mode.

## 7. Viewing dehumidifier humidity

**Steps**

1. On Home, choose **Bedroom**. The summary line shows "62% humidity". The Humidity widget (small) shows 62%, "Bedroom" and a comfort note; the Dehumidifier widget shows the gauge.
2. In other rooms, the Humidity widget still shows the dehumidifier's reading labelled "Bedroom". The wide size shows "No sensor" for rooms without one.
3. Tap the **Humidity** or **Dehumidifier** widget header to open the Dehumidifier sheet. It shows:
   - A large gauge.
   - The target marker, if Target humidity is on.
   - A comfort note.
   - A 12-hour trend with the comfort band.
4. **Ambient** shows "Humidity · Bedroom" and the value in large type.

**Expected behaviour**

- The reading comes from the real unit. Its age is shown when older than normal.
- The trend is built from stored readings.
- With the real unit's "Readings only" configuration, no controls appear anywhere: no power button in widgets, no target stepper, no mode, no tank.

**Gaps**

- Update frequency and stale threshold are undefined.
- History retention is undefined.
- Other humidity sensors do not feed the Humidity widget.

## 8. Changing device settings

**Steps**

1. Open the device's **Accessory** sheet from Devices, a widget header, or a Favourites tile.
2. In **What this device does**, choose **Readings only** or **Full control**, or switch individual capabilities. Controls and readings throughout the app update to match.
3. In **Connection**, tap **Connected via** to pick a different route.
4. In **Household**, rename the device, move it to another room, set **Who can use it**, and toggle **Show on Home dashboard**.
5. In **Personal**, toggle **Favourite** for the active profile.
6. **Done** closes the sheet. Changes apply immediately.

**Expected behaviour**

- Capability changes are bounded by what the device supports.
- Route changes require re-pairing on the new route.
- Shared changes apply for everyone. The Favourite switch applies only to the active profile.

**Gaps**

- Changing the route has no re-pairing step.
- "Show on Home dashboard" has no effect.
- "Who can use it" does not restrict control.

## 9. Using voice commands

**Steps**

1. Open **Voice**. The phase label reads "Hold to talk".
2. Press and hold the microphone: "Listening…" and a level visual. Release: the command appears in quotes, then "One moment…", then the response with an effect chip.
3. Alternatively, tap a **suggestion**: "Turn on the TV", "Open YouTube on the TV", "What is the bedroom humidity?", "Turn on the dehumidifier", "What's the weather today?" or "Good night".
4. The command is added to **Recent · {profile}**. Tapping a recent command runs it again.

**Expected behaviour**

- The microphone records only while held.
- Speech is recognised, mapped to an intent and checked against device capability and reachability, then executed. The response is shown and optionally spoken.
- Defined failures: device not in Talin Dock, capability off, device unavailable, blocked by device state (tank full).

**Gaps**

- In the prototype, holding the microphone does not use what the user says: it runs the next command in a fixed rotation.
- Not-understood and ambiguous requests are not designed.
- Language handling (English and Portuguese) is not designed.
- Spoken responses are not designed.
- Where processing happens is undecided (Q-14).

## 10. Launching YouTube

**Steps**

1. Open **Media** and tap **YouTube**. Alternatively, tap YouTube in the Media widget or a YouTube favourite or recent entry.
2. A sheet shows "Opening YouTube…", then "Opened YouTube" with a note that the real app opens in its own interface.
3. YouTube moves to the top of **Recently used**.

**Expected behaviour**

- Talin Dock checks availability and opens the installed YouTube app through its official app link. The user is then in YouTube.
- Returning to Talin Dock is through the operating system's normal app switching, or a dedicated return mechanism if one is designed.

**Distinct from**

- "Open YouTube on the TV" (voice) and the YouTube shortcut in Remote › Apps or the TV widget. Those launch YouTube on the **TV**, not the iPad.

**Gaps**

- The return path to Talin Dock after launching is not designed (Q-25).
- Deep-link targets for favourites are not specified per app.
- Whether YouTube still supports iPadOS 15 is unverified (Q-13).

## 11. Launching Spotify

**Steps**

1. Open **Media** and tap **Spotify**, or a Spotify favourite such as "Dinner at home playlist" (Household) or "Evening Focus Mix" (Anthony).
2. The same hand-off sheet appears, and Spotify moves to the top of Recently used.

**Expected behaviour**

- Opens the installed Spotify app. For a favourite, it opens at the deep-link target where Spotify supports it.
- If Spotify is not installed, the store page is offered. In the prototype, this fallback is shown with Plex and SoundCloud.

**Gaps**

- Whether favourites are user-defined or fixed is not designed; the prototype's favourites are fixed per profile.
- Spotify playback on a computer is a separate concept, shown in Computer mode's playback card.

## 12. Switching to Computer mode

**Steps**

1. Tap **Computer** in the sidebar's mode selector, or the **Computer** or **Display** section.
2. The accent changes to purple and the Computer screen opens on **Windows PC**.
3. Tap **Home** in the mode selector, or any Home-group section, to return. The blue accent, room and layout are unchanged.

**Expected behaviour**

- The mode only changes emphasis and accent. Home features keep running in the background.
- Computer mode never blocks Home.

## 13. Connecting to Windows

**Steps (prototype)**

1. The Windows PC is paired by default. The chips show USB Active, Wi-Fi Standby, Quality "Excellent · 2 ms" and Auto-reconnect On.
2. To simulate problems, go to **Settings › Connections › Windows PC**:
   - **Unplug** USB. With auto-reconnect on, the link switches to Wi-Fi and a toast confirms it.
   - **Drop** Wi-Fi as well. The PC shows "Disconnected", and Computer shows the "Windows PC Disconnected" state with **Reconnect**.
   - **Plug in** or **Restore** to recover.
3. **Unpair Windows PC**, then **Pair Windows PC**, simulates pairing.

**Expected behaviour**

1. The user installs the companion service on the PC.
2. Talin Dock shows a pairing code.
3. The user confirms it on the PC.
4. The pair is stored.
5. Talin Dock connects over the preferred link and falls back automatically when auto-reconnect is on.
6. Metrics, the mixer and shortcuts become live.

**Gaps**

- The pairing UI with a code is described in text but not shown.
- Companion installation is not designed.
- Behaviour when the PC is asleep or off is not designed.
- Multiple Windows machines are not supported.

## 14. Connecting to Mac

**Steps (prototype)**

1. On Computer, choose **Mac**. It shows "Mac Not Paired" with an explanation and **Pair Mac**.
2. Tap **Pair Mac**. The Mac becomes paired over Wi-Fi, and the metrics, mixer and shortcuts appear. The shortcuts differ: Activity Monitor and Mission Control.
3. Manage USB, Wi-Fi, the preferred link and auto-reconnect in Settings › Connections › Mac.

**Expected behaviour**: as Windows, with macOS-specific limits (§9.3 of the specification).

**Gaps**

- The per-app mixer on macOS is likely to need an additional audio component (Q-16).
- GPU metrics may be restricted.

## 15. Adjusting individual application volumes

**Steps**

1. On **Computer** with a paired computer, use the **Sound mixer**.
2. Drag **Master** or tap its mute button.
3. Drag the slider for Spotify, Browser, Discord, Game or System sounds; the percentage updates. Tap a row's speaker icon to mute it; the value shows "Muted" in red. Dragging a muted app's slider unmutes it.
4. Change **Output** to Speakers, Headphones or Monitor.

**Expected behaviour**

- The mixer lists the computer's real audio sessions. Applications appear and disappear as they start and stop audio.
- Each slider sets that application's volume on the computer, and the value read back matches.
- Output lists the computer's real output devices.

**Gaps**

- The app list is fixed in the prototype.
- Icons, grouping of multiple sessions per app, and handling of apps without names are not designed.

## 16. Connecting an external display

**Steps**

1. Open **Display**.
2. Read the note: separate display software is required, and Talin Dock hands off to it.
3. In **Windows PC** or **Mac**, choose **USB** or **Wi-Fi** and read the four setup steps.
4. Tap **Check for Display Host**. It shows "Checking over USB…", then "No display host found", with an explanation that the prototype has nothing to connect to.

**Expected behaviour**

- Talin Dock opens the chosen third-party display app, which takes over the screen.
- Talin Dock may report whether a host is reachable, if the software makes that detectable.
- Ending the session returns to Talin Dock.

**Gaps**

- The display software is not chosen.
- Detection may be impossible (Q-12).
- The return path is not designed.
- How Talin Dock behaves while in the background during a display session is not designed.

## 17. Editing dashboard widgets

**Steps**

1. On Home, select the room, then tap **Edit**. Alternatively, use **Settings › Dashboards & widgets › Edit Layout on Home**.
2. Each widget shows an overlay with its size name and four buttons:
   - **Move earlier**.
   - **Resize**, which cycles through the type's allowed sizes: Small, Wide, Large.
   - **Move later**.
   - **Remove**.
3. The **Add to {room}** tray lists widget types not yet in the room. Tapping one appends it at its first allowed size.
4. Tap **Done**.
5. Alternatively, in Settings › Dashboards & widgets, choose a room and switch widget types on or off; each row shows the current size.

**Expected behaviour**

- Layouts are per room, shared by all profiles, and persist.
- Each type appears at most once per room.
- Changes apply immediately, with no undo.

**Gaps**

- Direct drag-and-drop is not designed.
- Visual order under dense packing may not match the move order (Q-20).
- Large Favourites can clip its content.
- No per-widget settings.

## 18. Changing application settings

**Steps**

1. Open **Settings**. The left list separates **Personal · {profile}** (Profile, Calendars, Theme & display, Talin Voice) from **Household** (Members, Rooms, Dashboards & widgets, Device integrations, Connections, App shortcuts, About).
2. Each page states its scope at the top: "Personal · applies only to {name}", "Household defaults…" or "Household · applies to everyone".
3. Examples:
   - **Theme & display**: Charcoal, Slate or Black; 24-hour time.
   - **Calendars**: visibility per calendar, and sharing level for the profile's own calendar.
   - **Rooms**: Add Room, delete an empty room.
   - **Connections**: connect or disconnect integrations; manage computer links.
   - **App shortcuts**: show or hide media and TV apps.

**Expected behaviour**

- Personal settings follow the active profile.
- Household settings apply to everyone immediately.
- All settings persist.

**Gaps**

- Several stored settings do nothing yet: idle return, ambient when idle, voice options, voice language.
- Room renaming and naming are absent.
- Member management is absent.
- Integration setup from Settings is absent; only connect and disconnect toggles exist.
