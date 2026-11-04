# Phase 1 implementation status

## Working

- React/TypeScript application builds to static assets; all nine sections navigate and mode accents follow the section (Settings preserves the current mode).
- Live device-local clock/date; three rooms with distinct default widget sets and persistent widget visibility.
- Household plus two renameable personal profiles. Per-profile theme, clock format, future calendar visibility and favourites are persisted; household room layouts are shared.
- Storage allowlists, version checks, invalid snapshot recovery and visible save failure. No secrets or event contents are saved.
- Typed device IDs, types, rooms, capabilities, access, status, timestamps and readings. Capability guards reject unconfigured, hidden, stale, offline and read-only controls.
- Separate cloud/local adapters, guarded commands with a five-second deadline, resource state and provider interfaces.
- Manual ambient clock dialog through Quick actions; keyboard dismissal/focus handling for dialogs.
- Official website media shortcuts and separate App Store links.
- Manifest, Apple standalone metadata, touch icon, Pages configuration and security headers prepared.

## Explicitly unconfigured / deferred

Weather, calendar accounts, discovery, pairing, Samsung control, Tuya humidity, scenes, microphone/speech, computer pairing/metrics/control, USB, display detection/streaming and third-party hand-off. No real hardware or account was contacted. All TV controls and scenes are disabled.

`src/integrations/demo.ts` contains a labelled deterministic humidity fixture used only in tests/development; it is not imported into the application. No random data or fake live connection is displayed.

Advanced widget resizing/reordering, device renaming/moving/removing, room management, profile security, idle return, automatic ambient, media editing/history and configuration backup remain future work. The registry is currently static unconfigured examples. Calendar visibility preferences have no live events to filter. Profile switching is not a security boundary.

## Validation

See the final validation results recorded below. Browser emulation checks layout and interaction at the requested CSS dimensions; it does not establish Safari 15 compatibility, hardware memory use, native application hand-off, or latency on the iPad Air 2. The build targets Safari 15 but physical testing is still required.

No original artboards/screenshots were available. The visual design follows the written direction; comparison against the original is pending. No public deployment or external infrastructure changes were made.

### Results from this cloud instance

- `npm ci --no-audit --no-fund`: frozen-lockfile dependency install verified.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm test`: 9 tests passed (persistence, profile isolation, corruption/denied-storage recovery, navigation, capability/freshness gating and command deadline).
- `npm run build`: passed; production JavaScript approximately 183 kB / 58 kB gzip, CSS approximately 16 kB / 4 kB gzip.
- `npm run test:browser`: 3 passed. Both requested iPad dimensions exercise every section, room/widget persistence, profile name/time-format reloads, no horizontal overflow, disabled remote controls and dialog keyboard focus restoration.
- Chromium screenshots inspected in landscape and portrait; landscape spacing adjusted after inspection. This is not a comparison with the unavailable original prototype.
- Built assets served through Vite preview; representative room navigation passed with the prepared CSP injected into browser responses and no browser errors. Actual Cloudflare header delivery is untested because nothing was deployed.
- Real Safari/iPad hardware, real integrations, GitHub Actions execution and a fresh published cloud task have not been tested.
