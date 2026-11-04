# Cloud app implementation status

## Implemented

The React/TypeScript dashboard has nine sections, responsive navigation, Home/Computer accents, a real local clock, three room layouts, persistent widget visibility/order/size and personal profiles/preferences. Optional ten-minute idle return, backup export and reviewed restore now work. Old valid version-1 settings gain new defaults.

Monaghan, Ireland is the default weather location. The real application requests current conditions and a five-day forecast from Open-Meteo; a town search supports alternatives. A shared provider context deduplicates widgets, pauses refresh while hidden and retains a dated/stale cache on errors. No simulated weather is used in the application. The prior cloud continuation verified a live Monaghan current/five-day response; automated tests use explicit fixtures.

A generated service worker precaches public shell/assets only. First-time install does not reload the UI; later updates require an explicit action. Offline reload, persisted preferences and exclusion of API responses are exercised in browser tests. Standard PNG icons and an Apple touch icon are included. Actual iPadOS 15 installation/storage behaviour is still unverified.

The Pages Functions API and D1 schema are real implementations, exercised against local Cloudflare runtime/SQLite. Cloud sync has shared household password authentication, PBKDF2 verifiers, hashed opaque sessions, secure HttpOnly seven-day cookies, rate limiting, origin/header checks, a 32 KB body limit, strict settings allowlisting and revision conflicts. UI sync is explicit and requires confirmation of replacement. Sessions are revoked on logout. Display profiles remain personalisation only.

## Hosted status and remaining integrations

- Free D1 `talin-dock` is provisioned with the production schema, and its real ID is bound in root wrangler.jsonc. The desktop continuation has Cloudflare dashboard and GitHub connection access. See DEPLOYMENT.md for the current Pages and verifier status.
- The prior cloud task fetched the guide and installed 19 skills plus MCP registration; cloud-environment OAuth was still pending. DEPLOYMENT.md preserves those results.
- Samsung TV and Tuya dehumidifier are unconfigured examples with zero confirmed capabilities. No device scan, pairing or hardware command occurred. Controls and scenes stay disabled.
- Google, iCloud and Outlook provider options describe setup, but no private calendars are fetched. OAuth/CalDAV adapters, consent and encrypted credentials remain future work.
- Voice, automatic ambient/dimming, companions, USB and display hand-off/streaming are not implemented. No always-on PC host is required.

## Validation

Final results are recorded below after the complete validation run. Chromium CSS-size emulation does not prove Safari 15 performance or original-prototype fidelity. All five original specifications remain unchanged. A labelled deterministic demo adapter exists solely as an opt-in development/test fixture and is never registered in the app.

### Previous implementation validation

- Frozen dependency installation (`npm ci`) passed.
- Strict frontend and backend type checking, ESLint and production build passed.
- 15 unit tests passed: state/storage/profile/navigation/capability logic, weather parsing/cache/error handling, password verification and cookie parsing.
- 6 UI browser tests passed: both iPad dimensions, reload persistence, dialog focus, widget order/size, reviewed backup restore, location search and idle return.
- 5 full-stack tests passed against actual local Pages Functions/D1: unauthenticated/CSRF rejection, database persistence, unknown/oversized data rejection, revision conflicts, logout plus replayed-token denial, offline reload without API caching, browser sign-in/save/logout and durable login throttling.
- The documented local migration command was run twice; the second run had no migrations to apply.
- The documented full-stack development server started; with no password configured `/api/session` returned configured=false and preferences access returned 503. This verifies fail-closed setup.
- Production screenshots inspected at 1024×768 and 768×1024, including the genuine network-unavailable weather state, with no horizontal overflow.
- JavaScript is approximately 200 kB / 63 kB gzip; CSS approximately 17 kB / 4 kB gzip. This is build size, not a physical iPad memory/latency measurement.
- `wrangler whoami` reports no authenticated account. The later cloud task resolved network reachability; its recovered validation is recorded below. No live cloud, device, provider account or GitHub Actions execution is claimed.

## Recovered cloud setup — 2026-11-04

The prior cloud task fetched Cloudflare's official agent guide, installed 19 Cloudflare skills under `~/.agents/skills`, and registered `https://mcp.cloudflare.com/mcp` in `~/.codex/config.toml`. MCP OAuth and Wrangler authentication were still incomplete in that isolated cloud environment. The optional beta `cf` CLI was not installed. These installations do not imply installation or authentication on this Windows PC.

That task verified unrestricted HTTP reachability to Cloudflare and Open-Meteo, including real Monaghan current conditions and five forecast days. It reran `npm ci`, typecheck, lint, build, 15 unit tests, six browser tests and five local full-stack tests successfully. These are recovered historical results, not newly run Windows checks. Physical iPad/Safari validation remains outstanding.

## Initial desktop hosting — 2026-11-04 (historical)

Production is deployed at https://talin-dock.pages.dev/ from `feat/cloud-app`. Cloudflare reran typecheck, lint, 15 unit tests and build successfully. Live weather, offline-readiness status, HTTPS security headers and fail-closed unconfigured API behaviour were checked. Production verifier setup and authenticated hosted sync remain pending. Build audit reports development-toolchain vulnerabilities; no application dependency upgrade was included.

## Production verification — 2026-11-04

- Production URL: https://talin-dock.pages.dev/. Deployed source commit: `5f1901ab0cb50fd024ebf32dcf1fec0ea19e7f48`; secret-enabled deployment: `e56de6c6-559d-4ecd-9008-9e3ceaef83eb` (successful).
- The owner saved `TALIN_PASSWORD_HASH` as an encrypted production secret and signed in privately. No passphrase or verifier was read, logged or committed by the agent.
- Live `/api/session` reports configured=true. A separate unauthenticated client receives 401 for private preferences; a cross-origin login POST receives 403. API responses are no-store.
- The live browser shows Signed in. Read cloud copy successfully returned cloud revision 1, confirming an existing saved copy is persisted in remote D1 and readable through the authenticated API. Existing cloud/local preferences were not overwritten for verification. Second-device restore, hosted stale-write conflict and hosted logout/replayed-cookie checks remain acceptance checks; their local full-stack equivalents passed.
- GitHub Actions run 41896097954 passed typecheck, lint, build, 15 unit tests, seven browser tests and five local full-stack tests (27 tests). This includes the browser-only verifier helper test. Cloudflare's secret-enabled rebuild also passed its configured typecheck/lint/unit/build checks.
- A production-only dependency audit (`npm audit --omit=dev`) reported zero vulnerabilities. The development-toolchain findings were subsequently resolved; see the final cloud review below.
- No paid plan, payment method, billable integration or PC hosting dependency was activated. Physical iPad/Safari checks and calendar/device integrations remain outside this deployment verification.

## Final cloud review — 2026-11-04

- Synced the existing checkout to the desktop continuation on `feat/cloud-app`, preserving the earlier cloud notes in a named Git stash. Production was already deployed; isolated cloud CLI authentication is not required to use the hosted app.
- Independently verified production HTTPS/security headers, configured=true session status, 401 for signed-out preferences, 403 for cross-origin login, no-store API responses, service-worker installation and successful offline reload. Browser checks found no API paths in Cache Storage and no JavaScript page errors.
- Upgraded development-only Vitest from 3.2.7 to 5.1.0 to remove vulnerable mocker/Tinypool dependencies. Added a scoped minimatch 11 override only for typescript-estree, whose used `minimatch()` API remains supported. Remove the override once typescript-eslint declares a patched version itself. Application runtime dependencies and source remain unchanged.
- Full `npm audit` now reports zero vulnerabilities, including development dependencies. Typecheck, lint, build, 15 unit tests, seven browser tests and five local full-stack tests passed. Lint/typecheck were also checked after the scoped override.
- Owner sign-in and remote cloud revision 1 were verified by the desktop continuation. This isolated cloud browser has no owner session; hosted authenticated conflict/restore/logout checks and physical iPad acceptance remain outstanding. No production preferences were overwritten and no password was requested or reset.

## Offline notice correction — 2026-11-04

The owner reported the interface remained visible offline on the iPad while the banner incorrectly said offline reload was unsupported. Removed this obsolete Phase 1 message. The notice now describes available local features and the internet requirement for live weather and cloud sync. The existing offline reload test also checks the corrected notice and rejects the obsolete wording. Service-worker/cache behaviour is unchanged; an already-open interface is not proof of physical iPad cold-launch behaviour.

Validation for the notice correction: typecheck, lint, production build, 15 unit tests, seven UI browser tests and five local full-stack tests passed, including the offline reload/banner regression check.
