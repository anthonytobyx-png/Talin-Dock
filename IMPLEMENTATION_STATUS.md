# Cloud app implementation status

## Implemented

The React/TypeScript dashboard has nine sections, responsive navigation, Home/Computer accents, a real local clock, three room layouts, persistent widget visibility/order/size and personal profiles/preferences. Optional ten-minute idle return, backup export and reviewed restore now work. Old valid version-1 settings gain new defaults.

Monaghan, Ireland is the default weather location. The real application requests current conditions and a five-day forecast from Open-Meteo; a town search supports alternatives. A shared provider context deduplicates widgets, pauses refresh while hidden and retains a dated/stale cache on errors. No simulated weather is used in the application. Live external responses are unverified in this environment because the provider hosts are blocked; tests use explicit fixtures.

A generated service worker precaches public shell/assets only. First-time install does not reload the UI; later updates require an explicit action. Offline reload, persisted preferences and exclusion of API responses are exercised in browser tests. Standard PNG icons and an Apple touch icon are included. Actual iPadOS 15 installation/storage behaviour is still unverified.

The Pages Functions API and D1 schema are real implementations, exercised against local Cloudflare runtime/SQLite. Cloud sync has shared household password authentication, PBKDF2 verifiers, hashed opaque sessions, secure HttpOnly seven-day cookies, rate limiting, origin/header checks, a 32 KB body limit, strict settings allowlisting and revision conflicts. UI sync is explicit and requires confirmation of replacement. Sessions are revoked on logout. Display profiles remain personalisation only.

## Not provisioned or connected

- No remote D1 database, Cloudflare Pages project, production verifier or public deployment has been created. The root database ID is a local placeholder. Account binding and network access are missing.
- The requested Cloudflare agent setup guide could not be fetched (proxy 403). It has not been read or executed. DEPLOYMENT.md records the exact blocker and pending steps.
- Samsung TV and Tuya dehumidifier are unconfigured examples with zero confirmed capabilities. No device scan, pairing or hardware command occurred. Controls and scenes stay disabled.
- Google, iCloud and Outlook provider options describe setup, but no private calendars are fetched. OAuth/CalDAV adapters, consent and encrypted credentials remain future work.
- Voice, automatic ambient/dimming, companions, USB and display hand-off/streaming are not implemented. No always-on PC host is required.

## Validation

Final results are recorded below after the complete validation run. Chromium CSS-size emulation does not prove Safari 15 performance or original-prototype fidelity. All five original specifications remain unchanged. A labelled deterministic demo adapter exists solely as an opt-in development/test fixture and is never registered in the app.

### Final checks in this instance

- Frozen dependency installation (`npm ci`) passed.
- Strict frontend and backend type checking, ESLint and production build passed.
- 15 unit tests passed: state/storage/profile/navigation/capability logic, weather parsing/cache/error handling, password verification and cookie parsing.
- 6 UI browser tests passed: both iPad dimensions, reload persistence, dialog focus, widget order/size, reviewed backup restore, location search and idle return.
- 5 full-stack tests passed against actual local Pages Functions/D1: unauthenticated/CSRF rejection, database persistence, unknown/oversized data rejection, revision conflicts, logout plus replayed-token denial, offline reload without API caching, browser sign-in/save/logout and durable login throttling.
- The documented local migration command was run twice; the second run had no migrations to apply.
- The documented full-stack development server started; with no password configured `/api/session` returned configured=false and preferences access returned 503. This verifies fail-closed setup.
- Production screenshots inspected at 1024×768 and 768×1024, including the genuine network-unavailable weather state, with no horizontal overflow.
- JavaScript is approximately 200 kB / 63 kB gzip; CSS approximately 17 kB / 4 kB gzip. This is build size, not a physical iPad memory/latency measurement.
- `wrangler whoami` reports no authenticated account. Cloudflare guide/provider requests remain blocked by live network policy. No live cloud, device, provider account or GitHub Actions execution is claimed.
