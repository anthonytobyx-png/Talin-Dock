# Home setup checklist

Do not send tokens, pairing keys or private calendars in chat. Phase 1 needs none. Collect non-sensitive observations first; use secure settings for credentials only once a reviewed integration exists.

## iPad Air 2

- Record exact iPadOS 15.x and Safari versions, storage availability and current battery/charging condition.
- Once HTTPS deployment is approved: open Safari, Add to Home Screen, verify standalone launch/icon and returning from app switcher. After Available offline is shown, test closing and reopening without Wi-Fi; Safari may evict cached storage.
- Check 1024×768 landscape and 768×1024 portrait: nav rail/sidebar, all touch targets, keyboard, scrolling, text scaling, contrast and VoiceOver labels. Compare original artboards when available.
- Switch room/profile; rename personal profiles; change time format/theme; change widget visibility. Reload, close/reopen and restart iPad; verify persistence. Check private-browsing/storage-denied behaviour without deleting valuable data.
- Check clock matches device time/timezone including midnight. Measure cold start and room-switch latency; watch Safari reloads/memory pressure over a day. These are unmeasured on real hardware.
- Test Wi-Fi loss: open clock works, no fake readings appear. After offline installation completes, test an offline reload and confirm the saved layout remains.
- Decide docked auto-lock, charging and manual return policy. Do not assume wake lock, kiosk relaunch or automatic brightness.

## Samsung TV UE43U8000F

- Confirm exact model/firmware, LAN topology and network standby settings. Record whether TV and a potential low-power bridge share a reachable subnet; note guest Wi-Fi/client isolation.
- With a reviewed local adapter, approve pairing on the physical TV; keep token private. Test power-off and standby wake separately.
- Verify directional keys, OK, Back, Home, mute/volume, source cycle versus direct selection and media keys. Record each supported capability and acknowledgement latency.
- Verify reported power, current input, app and volume; test changes made with physical remote and stale/offline recovery.
- Read installed app identifiers, especially sideloaded Moonlight. Do not assume launch support or list availability.
- Separately assess SmartThings authentication, scopes and genuinely free ongoing access before choosing cloud control. Cloud hosting cannot directly access the LAN.

## Smart Life / Tuya dehumidifier

- Record manufacturer/model, Smart Life app region, firmware, and available humidity data points/units without exposing device IDs or local keys publicly.
- Confirm humidity-only operation. Do not enable power, target, temperature, mode or tank controls based on prototype defaults.
- Compare reported humidity with Smart Life and physical display at several times; measure update interval, timestamp availability, disconnection and stale recovery.
- Evaluate free ongoing Tuya cloud access versus a local-key route through an optional bridge. Reject subscription/trial-only dependencies. Decide history collection location before promising continuous 12-hour trends.

## Accounts, media and network

- Choose weather location/units/source and verify free terms. No location is guessed.
- Choose calendar providers, read-only scope, shared-device privacy and authentication. OS calendar permissions cannot grant this web app native calendar access.
- Test each media app's iPadOS 15 availability, official website hand-off, explicit App Store link and manual return to Talin Dock. The website cannot reliably detect installed apps or launch success.
- Home must function with every PC off. A low-power hub is optional future architecture, not a hidden requirement today.
- Keep companion/USB/audio/display/voice testing for later phases. Check any third-party display software's cost and OS support; Sidecar does not support iPad Air 2.

## Updated cloud-app checks

After the approved HTTPS deployment exists, verify Monaghan weather and change/restore the town. Test offline launch after the app reports Available offline; confirm stale weather is labelled, the clock continues and private/API data is absent from the service-worker cache. Safari may evict storage, so keep an exported backup.

Sign in to household cloud storage; explicitly save/read preferences from a second browser, confirm replacement behaviour, then sign out and confirm private API access is denied. Local names/preferences remain on the browser after logout. Never use the published test-only password for production. Test backup import cancellation and restore, widget order/size and optional idle return on the actual iPad.

A live Monaghan weather response was verified in the previous cloud task. The remote free D1 schema is now provisioned; see DEPLOYMENT.md for Pages publication and authentication status. Physical iPad checks remain required.

Hosted dashboard: https://talin-dock.pages.dev/. The desktop browser showed live Monaghan weather and Available offline. The production verifier is configured; test household cloud sign-in with the owner’s existing passphrase. Neither this desktop check nor the prior browser tests proves physical iPad compatibility.

The owner reported the dashboard remained visible on the iPad without a network, alongside an outdated “Reloading offline is not supported yet” banner. The banner has been corrected to describe available local features and the internet requirement for live weather/cloud sync. A visible open page alone does not establish a cold offline launch; check reload and reopening separately.

## Current home follow-up

- TV local identity and physical pairing were verified on 2026-11-04; no control commands were tested and no hosted route is configured. Identify an existing independent home hub before enabling device controls in the hosted app.
- Confirm dehumidifier manufacturer/model in Smart Life and its authenticated humidity data point/unit/time semantics; LAN advertisements alone do not identify the product or prove sensor access.
- On the iPad, check Settings remains reachable with browser bars/keyboard visible, then check Home/profile navigation, 44px touch targets, update acceptance and cold offline reopening. The desktop fix and tests preserve preferences; they do not prove Safari hardware behaviour.
- Select the first calendar provider only after the device-route blockers have been recorded; authorise read-only access through the provider's secure flow, never through chat.

The owner subsequently confirmed both devices are on, stated that no separate hub should be needed because the iPad is local, and deferred calendars (likely iCloud). A direct Safari route remains unverified; local presence alone does not grant trusted TV TLS access or raw Tuya protocol access. Calendar implementation is deferred at the owner's request.
