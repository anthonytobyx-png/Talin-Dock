# Cloud app implementation status

## Faster computer command delivery — 6 November 2026

- The standalone Talin app remains the selected experience. A USB cable is optional research, not an implemented transport. No spacedesk service, USB filter driver, desktop streaming, new LAN listener or paid service was installed for this change.
- The authenticated cloud agent now optionally waits for commands for a bounded 4.5 seconds while watched or 14 seconds idle, checking at 500 ms / 1 second respectively. New companions report execution immediately; older companions retain their existing polling protocol. Claims remain atomic, expired commands cannot be released, and revocation is checked again before releasing a response. Each wait has an explicit query-count bound and disconnect cleanup. Existing capability validation, rate limits and no automatic replay remain.
- The UI measures elapsed request-to-companion-acknowledgement time and labels it as cloud transport. It does not present HTTP request time as device execution latency, or key submission as media playback confirmation. A late response cannot update acknowledgement text after switching computer/session or going offline.
- Local native acceptance with a disposable Pages/D1 database measured 315–607 ms across master volume, application volume and speaker mute acknowledgements. Existing values were reapplied, the original audio state was retained, and no microphone audio was captured. These figures are local test results, not measured iPad/internet latency. The full local app checks and Windows bootstrap security checks passed.
- Updating an installed companion preserves its per-user encrypted credentials and pairing. The reviewed shared-runtime updater only replaces hash-verified executable/assembly files, requires unchanged dependency/runtime configuration, preserves rollback copies and refuses a running shared companion. Administrator-owned code and the second account's enrollment/startup remain protected. Actual iPad acceptance and Barbara's first live report are still outstanding.

## Verified PC and second Windows account — 5 November 2026

- Anthony's companion is paired in production and starts at Windows sign-in under his own account. The deployed Computer page received real CPU/memory/NVIDIA/audio reports. A production UI volume request was acknowledged with the starting 82% level retained. Home data and the existing Smart Life connection were preserved. The initial computer implementation/deployment and Windows CI passed all 65 app checks plus native audio/queue tests.
- The owner requested the same setup for the second account, Barbara. Her separate cloud identity is paired, and the administrator installation completed successfully. The copied runtime and protected enrollment were verified; her startup shortcut is installed and redundant staging ciphertext was removed. No Anthony credential is copied. Her first normal sign-in and live native-audio report remain unverified; do not claim her companion is active yet.
- The second-account bootstrap is Windows-machine encrypted, stored in a protected directory and bound in the companion to Barbara's exact Windows SID. The completed administrator installer restricts its runtime to administrator writes and its bootstrap to that account/admin/SYSTEM. At her next normal sign-in, the companion seals its own credential with CurrentUser DPAPI and consumes the bootstrap. Tests rejected the wrong SID and a broadly readable output directory, and verified successful user-bound sealing/consumption with a separate local fixture. No account password, registry hive, private files or browser credentials were extracted.
- The installer changes only the Talin ProgramData runtime/enrollment and the target user's Talin startup shortcut. It creates no system service, firewall rule, router configuration, paid service or certificate trust change. Existing different startup/enrollment files are preserved. Physical iPad setup remains deferred until the end.

## Computer continuation — 5 November 2026

This section supersedes older statements that Computer mode is entirely unimplemented.

- A free Windows companion and authenticated cloud relay are implemented. They report measured CPU/memory, supported NVIDIA load/temperature/memory, the default multimedia output's volume/mute and application audio sessions, and default communications-microphone mute. No audio, screenshots, window titles, executable paths or playback titles are collected. Unsupported telemetry stays unavailable.
- Computer controls use the existing household sign-in: master/application volume and mute, communications-microphone mute, Windows media keys, Show Desktop and Task Manager. There is no arbitrary shell, remote file execution, new LAN listener, port forwarding or new iPad certificate for this route. Lock, sleep, screenshot capture, output switching, USB and macOS are not implemented.
- Native tests verified real PC reports and a queued cloud-runtime-to-Windows master-volume change/readback, per-session volume and master-mute readback. The original volume/mute were restored. Media/desktop shortcuts were not triggered during the owner's active session; successful key submission is not playback confirmation.
- Companion credentials are random 256-bit values encrypted by Windows DPAPI for the current user, outside browser preferences and the repository. D1 stores only the token hash, latest allowlisted report and bounded command history. Authenticated Settings supports pairing from a public-verifier request file and revocation. The Windows installation is prepared; production pairing/startup require the final access grant before this PC is reported connected.
- The additive 0005_computers.sql schema was applied to the existing free production D1 database without overwriting household data. Reports poll at 15 seconds while idle and about five seconds during visible Computer use; disconnect/stale controls disable after 30 seconds. This initial route requires internet and uses free quotas, not a claimed USB/LAN connection. Home never depends on the companion.
- Commands are allowlisted, scoped per computer, validated against its reported capabilities, rate-limited and claimed once. Uncertain commands are not retried. Requests expire after 20 seconds; old claims become unknown. Revocation removes the private snapshot and blocks new polls/claims. Computer reports and credentials are never service-worker cached or written to browser localStorage.
- .NET 10 LTS is isolated for building; the runtime package is self-contained, user-local and needs no administrator service. NAudio.Wasapi 2.4.0 is used under its free license. npm and NuGet vulnerability audits found zero vulnerabilities. Windows CI builds the companion with locked dependencies; app checks cover actual local Pages/D1 authentication, claims and revocation.
- iPad installation remains deferred until the end. No paid plan, trial, subscription or automatic paid upgrade is enabled. Other household computers and a physical iPad/PC-off acceptance test remain unverified.

## Current setup policy — 5 November 2026

This section supersedes earlier continuation snapshots below.

- Finish the web app and connections first. The owner wants the setup handled by the agent and no repeated iPad or per-widget password steps. The temporary encrypted-identity transfer is stopped; no iPad certificate or identity has been installed automatically.
- Household Settings is the single place for cloud sign-in, provider consent and advanced home connection settings. Device widgets use saved connections and expose controls/readings, without separate pairing/password forms. Existing household preferences and provider credentials are preserved.
- One household session authorises cloud APIs; each private endpoint still validates authentication. Provider credentials stay server-side. The current TV route also requires a one-time OS client identity and trusted household server certificate, rather than a daily widget password. Household cloud sign-out is not revocation of that separate OS identity. No security checks are removed to imitate unified sign-in.
- The TV hub's mutual-TLS endpoint, native SmartThings On/Off rules, one-minute timer execution, cancellation and saved history across driver updates were verified. Provider reads confirmed power changes and the starting Off state was restored. Current endpoint: https://192.168.1.3:42047. Native rules execute in Samsung Cloud and require internet; no PC runtime, Alexa, port forwarding or paid API is used. Smart Life humidity/power/countdown/cloud timers retain the existing direct route.
- Talin controls were published in 1f18d385788f494ed2d744968b543737a5900932; GitHub verification and Pages deployment succeeded. Actual Safari/iPad and physical PC-shutdown acceptance remain incomplete. The household certificates expire 7 December 2027; hub restarts may change the local port.
- The existing Cloudflare dashboard session is usable, but its domain overview lists no registered domains. A publicly trusted household LAN hostname has not been established. iPadOS trust/identity approval cannot be performed remotely through this PC's tools. That physical limitation remains; onboarding is deferred while the web app is completed. Keep debugger certificate verification unchanged and everything free.

## Verified continuation — 5 November 2026

This section supersedes older phase/setup statements below.

- Production: https://talin-dock.pages.dev/. Pages, D1 and the independent minute timer Worker remain free. Household preferences and the encrypted Smart Life connection are preserved.
- Devology DEV_19: direct Smart Life humidity, online/power reporting, power commands, native 2-hour countdown/cancellation and durable cloud timers work inside Talin. Provider reads confirmed power changes; the dispatcher acknowledged a due command with the browser closed. Physical observation and a real PC-off/iPad test remain outstanding. Sensor sample timestamps are unavailable; retrieval time is not measurement time. No humidity history is promised.
- Samsung: its existing hub runs the read-only LAN diagnostic. Official CLI Off/On commands were acknowledged and provider reads confirmed each state; the initial On state was restored. This is diagnostic evidence, not Talin TV control. Hub operation with the screen off remains unverified.
- Bounded router DNS resolved Talin's public address; public TCP then failed with “Network is unreachable”. Samsung intentionally limits LAN Edge drivers to private addresses. No egress bypass, PC bridge, port forwarding or paid API is used. TV controls remain disabled in Talin.
- A private local HTTPS experiment did not establish a working authenticated connection. The temporary listener was removed and replaced by the public outbound-only diagnostic; a fresh authenticated hub status confirmed the outbound TCP failure. No certificate was installed/trusted; debugger certificate verification remains unchanged. A further private server-key upload requires specific consent. No production TV route is established.
- Alexa is no longer being pursued, per owner instruction. Existing credentials/doorbells were left unchanged; trigger acknowledgements never proved appliance execution. Calendars remain deferred; Google/iCloud/Outlook options remain.
- Desktop responsive/offline checks passed previously. Safari 15/iPad Air 2 touch, updates, cold offline launch and PC-off checks still require the physical iPad. Preserve household preferences when testing.

- Validation: typecheck, lint, build, 40 unit/backend, 12 browser, 5 local Pages/D1 and 27 public Lua diagnostic checks passed. The initial sandboxed Vitest run failed on filesystem realpath permissions; the authorised rerun outside that sandbox passed.

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

## Home PC investigation — 2026-11-04

The owner explicitly authorised local discovery and device pairing, superseding earlier restrictions on hardware investigation. No billable services, trials, port forwarding or required PC bridge are authorised.

- The Samsung TV identified itself as UE43U8000FKXXU (Tizen), powered on, with token authentication advertised. The owner accepted Talin Dock setup on the physical TV. A certificate-pinned TLS WebSocket returned ms.channel.connect and a token. The token was kept only in process memory and was not retained or logged. No control command was sent; no directional, volume, app-launch or power capability is claimed as tested.
- A Tuya-compatible LAN advertisement and control port were observed. The actual manufacturer/model and association with the dehumidifier are not yet confirmed. No authenticated data points, humidity value, timestamp or local key was obtained. No device controls were enabled.
- No running Docker containers or reachable Home Assistant endpoint were found during the targeted local survey. This does not exclude a hub elsewhere or a service on another port/network. Router and SmartThings web pages require sign-in in the inspected browser.
- The hosted HTTPS Safari app has no verified end-to-end device route. Cloudflare cannot reach private LAN addresses. The TV's locally pinned certificate does not establish a trusted browser connection from Safari. An existing independent hub/secure route must be identified before implementing hosted device controls; a PC pairing test alone is insufficient.
- Samsung's current policy makes custom OAuth cloud API Access Apps paid; temporary PATs are not a sustainable integration. Do not use that route under the owner's free-only instruction. Source: https://blog.smartthings.com/smartthings-updates/smartthings-api-additional-details-for-developers-and-business-partners/
- Tuya developer IoT Core trials are not accepted as an ongoing free route. Home Assistant's official Tuya integration uses the Smart Life account/user code and QR consent, but would need an existing independent host and verified device data points. Source: https://www.home-assistant.io/integrations/tuya/
- Local browser tests reproduced a profile-footer overlap blocking Settings in shorter windows. Navigation now scrolls within the remaining sidebar space and the profile footer does not shrink. Two touch-enabled short-tablet regression tests exercise Settings, Home, profile access, navigation target size and horizontal overflow.
- Typecheck, lint, build, 15 unit tests, nine browser tests and five local full-stack tests passed after the fix (29 tests). Windows used installed Chrome for Playwright. Cloud preferences were not overwritten. Physical Safari 15 keyboard, touch, cold offline reopening, update prompt and long-session performance still require the owner's iPad.
- Calendar integration remains unchanged pending provider selection. Google, iCloud and Outlook choices are preserved.

The owner subsequently confirmed both devices are on, stated that no separate hub should be needed because the iPad is local, and deferred calendars (likely iCloud). A direct Safari route remains unverified; local presence alone does not grant trusted TV TLS access or raw Tuya protocol access. Calendar implementation is deferred at the owner's request.

## Home deployment and Alexa follow-up

Commit `99ee6c72f81d19b2f367d43619cecf505602956e` passed GitHub run 41905460168 and Cloudflare deployment 57fd4223-216f-4662-9fa3-783d0630042a. Production serves the scrollable navigation CSS. Home/Settings navigation and explicit Update app activation were checked in a 1024x600 browser viewport; the update reloaded successfully and retained the existing room selection. No household/cloud preferences were overwritten.

The owner reports both devices are linked in the Alexa app without an Echo speaker. This is useful account-linkage information but is not independently verified device capability or third-party API consent. Amazon's documented Smart Home API integrates a developer's own device cloud/add-on; the reviewed REST API does not establish a general Talin API for commanding devices belonging to other linked skills. No private Alexa cookies were extracted, no paid Alexa service was enabled, and no Alexa relay integration is claimed. Source: https://developer.amazon.com/docs/alexaplus/smarthome/rest-api-reference

## Dehumidifier identity clarification

The owner identified the appliance as Devology, model Virgo-RCS12(y)-N7-1, SKU DEV_19. This owner-supplied identity is now recorded in the device registry without changing its ID, room, read-only access, unconfigured status or empty confirmed capability set. Devology's official DEV_19 page confirms Smart Life app connectivity and adjustable humidity targets, but does not publish the authenticated data-point schema required for this unit. Similar Virgo model names sold by other brands are not proof of identical firmware or Tuya data-point mappings.

Source: https://devologyhome.com/collections/large-dehumidifiers/products/devology-12l-large-dehumidifier-dev-19

The dashboard previously claimed power/target/mode controls were unsupported by the household appliance. That was stronger than the evidence: the owner requested read-only humidity monitoring. The wording now explains that scope and the unverified connection. No power, target, fan or mode control was enabled; no sensor reading or timestamp is fabricated. Actual authenticated humidity data, units, update cadence and stale/offline handling remain pending a verified connection.

## Power and countdown requirements — superseding humidity-only scope

The owner now explicitly requests power on/off and timers for this appliance and future supported devices. The dehumidifier record permits control access in principle, but still has no confirmed capabilities and remains unconfigured. No hardware command was sent or enabled by this change.

A reusable device-controls panel now exposes on/off and countdown action/duration, plus timer refresh/cancellation. The adapter-neutral timer port must create, list and cancel durable schedules on the actual device or an authenticated online service. Capability and access checks require fresh, online state, matching adapter identity, confirmed power and timer capabilities, and valid duration bounds. A generic future plug is exercised by the tests; the feature is not restricted to the two initial appliances.

There is deliberately no browser countdown used to deliver device commands. Timer creation requires a valid, matching receipt with an ID, executor, action and expected due time. Acknowledgement is not presented as proof of execution. Timeouts abort local waiting without automatic retries and explain that the device may have received the request; refresh is required before retrying. Adapter/server authentication, household permissions, idempotency and durable delivery must be implemented and verified for each real integration before enabling it. No public control endpoint or cloud scheduler has been added.

Existing production connections still do not implement these operations, so controls are disabled rather than simulated. Future purchases need a supported protocol/integration and verified individual capabilities; arbitrary device compatibility is not promised. Old read-only notes above are historical and superseded by this owner request. Household preferences, cloud preference schema and stored backups are unchanged.

Validation: 22 unit tests, ten browser tests and five real local Pages/D1 tests passed, including timer guards and the unconfigured-device UI. Typecheck, lint and build passed. This validates the reusable boundary and unavailable state, not real appliance commands or durable schedule execution.

## Alexa bridge preparation — 2026-11-05

The owner authorised a free cloud route and signed into Virtual Smart Home. Its account dashboard states URL Routine Trigger is free and contributions are optional; four named triggers were created without a contribution, trial or payment. The owner enabled the Alexa skill. Each trigger returned a matching JSON triggerActivationStatus=success, but the owner observed no appliance change. The four Alexa doorbells are event sources, not power controls: Alexa routines still need to map each pressed event to the real appliance power action. Alexa's own device power buttons work according to the owner. The browser-accessible Alexa assistant listed the real TV/dehumidifier and four doorbells but explicitly refused routine creation on the web; phone setup remains necessary. No action is marked verified merely because the bridge acknowledges a trigger.

An authenticated /api/device-actions route and in-app controls are implemented. Only individually verified server configuration enables an action. Server-side command reservations prevent replay delivery; uncertain outcomes never retry automatically. Credentials stay in the encrypted TALIN_ALEXA_TRIGGERS production secret, saved with the owner's specific consent. Its four records currently have verified=false. No credentials are sent to the frontend or saved in household preferences. One trigger URL appeared accidentally in tool output; the owner declined replacement and explicitly asked to keep it unchanged. Its value is not recorded in this repository.

A separate Free Workers Cron runner and D1 timer API are prepared. Timers require a recent runner heartbeat with a matching configuration hash. Schedules persist in D1, use 2-minute to 24-hour countdowns, dispatch approximately once per minute, expire after a two-minute missed-delivery window, and never retry a claimed command. Cancellation only succeeds before dispatch. Acknowledged means the trigger service accepted the request, not that the appliance changed state. Limits are eight pending schedules and 24 created per rolling day; command submissions are capped at six per minute and 200 per rolling day. Runner provisioning/production schedule execution and physical iPad/PC-off acceptance remain unverified. No humidity/state telemetry is provided by this trigger route.

Validation: typecheck, lint, build, 31 unit/backend tests, 11 browser tests and five local Pages/D1 tests passed. Backend tests use in-memory SQLite with the actual migration/query SQL and explicit mocked upstream acknowledgements. Real appliance success has NOT been established. The Worker deployment dry run succeeded; its public HTTP handler always returns 404, and request observability is disabled to avoid recording upstream credential URLs.

## Route research and production follow-up — 2026-11-05

The owner paused the Alexa routine setup and asked for a wider search, including Reddit, for near-native controls and sensor data. Alexa remains a command-only fallback, not the preferred telemetry route. A fresh browser session at Alexa.com listed the real devices and four virtual doorbells, then explicitly refused routine creation on the web. The owner clarified that the phone app showed the four doorbells; this does not establish that any event-to-appliance routines exist.

Commit e765bdc39a3cfba7577a617f3cbd880183ec47be passed GitHub Actions run 41942610042 and Cloudflare Pages deployment aeb0840f-c195-41a4-bcce-fa9090241383. Production update activation and authenticated connection checks were observed: both actions remain unverified/disabled and the timer runner is not ready. Existing preferences were not written. Total local checks: 31 unit/backend, 11 browser and five local full-stack tests, plus typecheck/lint/build and Worker dry run.

A temporary loopback-only read-only Tuya probe is prepared outside the repository. It uses Tuya's official sharing SDK and the public Home Assistant registration, with that identity clearly disclosed before user consent. The user must enter the Smart Life User Code privately and approve the QR on the phone. Credentials stay in process memory; only selected dehumidifier capabilities/readings/timestamps may be saved locally. No appliance commands, cloud developer project, API trial or payment is part of this diagnostic. It does not establish a supported permanent Talin cloud client or PC-off route; discovery is pending.

Samsung's exact UE43U8000FKXXU product specification advertises SmartThings/Matter Hub functionality. This is a lead for investigating an existing independent home component, not proof of support for a custom LAN driver or Tuya Wi-Fi control. The TV's previously observed IP did not answer ports 8001, 8002 or 39500 while the owner reported both appliances off. No wake or settings commands were sent during research.

References: https://www.home-assistant.io/integrations/tuya/ ; https://github.com/tuya/tuya-device-sharing-sdk ; https://github.com/vineetchoudhary/tuya-local-key ; https://www.home-assistant.io/integrations/samsungtv/ ; https://www.samsung.com/uk/tvs/uhd-4k-tv/u8000f-43-inch-crystal-uhd-4k-smart-tv-ue43u8000fkxxu/ ; https://blog.smartthings.com/smartthings-updates/smartthings-api-additional-details-for-developers-and-business-partners/ ; https://community.thehomeremote.com/t/problem-logging-into-smartlife-and-tuya/13522/8 ; https://www.reddit.com/r/homeassistant/comments/1vn4zj0/tuya_device_cloud_plan/

## Direct Smart Life implementation — 2026-11-05

The owner approved the diagnostic QR. Tuya returned exactly one matching DEV_19 dehumidifier (category cs), online, with a Boolean switch, humidity_indoor in percent with scale zero, and countdown_set choices cancel/2h. The device update_time is old metadata and is not treated as a humidity measurement time. The diagnostic sent no commands and retained no credentials.

A direct device-sharing adapter now implements the SDK signing/encryption protocol using Web Crypto and a protocol-only MD5 implementation. A golden vector generated with Tuya's official SDK verifies interoperability. Tuya's MIT licence and attribution are included. The compatibility login openly uses Home Assistant's public registration; Talin does not claim to be an official Home Assistant installation or a certified Tuya app. No developer project, paid API or trial is created. Continued availability outside Home Assistant is not guaranteed.

Authenticated Talin setup requests the User Code privately and displays Tuya's consent QR. The user approves device access/control and encrypted Cloudflare storage. D1 pairing records are encrypted, session-bound, short-lived and rate-limited. Successful setup stores only the selected appliance connection encrypted with AES-GCM; the 256-bit key is a production encrypted secret. Refresh tokens are updated under a D1 lease. Provider responses, device identifiers, user codes, tokens and keys never go to the display preference store or frontend diagnostics. Existing preferences are not modified.

Home and Devices consume a shared, visible-page-only cloud resource. Humidity is labelled latest reported with measurement time unavailable; retrieval time is separate. Read failures preserve stale values and disable commands. Login/logout updates private resource state. Power and the discovered native countdown are guarded server-side; unknown outcomes never retry automatically. Unsupported target/mode/lock controls stay absent. The generic durable timer route can now dispatch to direct Tuya through the independent Free Worker; it stays disabled without a matching fresh runner heartbeat. No PC-side bridge is used by this architecture.

The additive Tuya migration was applied in the existing production D1 console. TALIN_TUYA_KEY was generated in temporary setup memory and saved only as an encrypted production secret. Permanent account connection and physical command/countdown acceptance are still pending deployment and the final in-app QR approval. The read-only diagnostic approval did not retain reusable credentials and must not be presented as a completed hosted connection.

The TV hub is now registered in the owner's SmartThings account, firmware 000.062.00014. Its dashboard reports Edge drivers, the local hub API and local virtual devices Available, with memory/driver limits Ok. This is verified hub capability, not yet an authenticated Talin route or proof of operation with the TV screen off. No hub/device was reset or removed and no paid API plan was selected.

Implementation validation before publication: typecheck, lint, production build, 37 unit/backend tests, 12 browser tests and five local Pages/D1 tests passed. Runtime dependency audit reported zero vulnerabilities. The separate timer Worker bundle dry run also passed. These checks validate protocol fixtures, encrypted storage, session-bound pairing and UI behaviour; physical hosted device operation remains pending the final QR connection and device tests.

## Hosted Smart Life QR fix � 2026-11-05

The first hosted QR attempts failed before contacting Tuya: Cloudflare Workers rejects fetch's `redirect: "error"` option. The initial encrypted pairing reservations were saved, but no QR token or permanent connection was stored. Provider requests now use `redirect: "manual"` and reject every non-2xx response, so credentials cannot follow redirects. The same incompatible option was corrected in signed Tuya requests and the optional Alexa transport.

A real local Workers-runtime smoke request with an intentionally invalid, non-household User Code reproduced the old TypeError. After the fix it reached Tuya and received HTTP 200 / USERCODE_INCORRECT. A backend regression covers rejected QR/signed-request redirects without forwarding credentials. This transport check is not an account connection or a successful device command. Hosted QR approval and physical command verification remain required.

## Hosted Smart Life QR fix — 2026-11-05

The first hosted QR attempts failed before contacting Tuya: Cloudflare Workers rejects fetch's `redirect: "error"` option. The initial encrypted pairing reservations were saved, but no QR token or permanent connection was stored. Provider requests now use `redirect: "manual"` and reject every non-2xx response, so credentials cannot follow redirects. The same incompatible option was corrected in signed Tuya requests and the optional Alexa transport.

A real local Workers-runtime smoke request with an intentionally invalid, non-household User Code reproduced the old TypeError. After the fix it reached Tuya and received HTTP 200 / USERCODE_INCORRECT. A backend regression covers rejected QR/signed-request redirects without forwarding credentials. This transport check is not an account connection or a successful device command. Hosted QR approval and physical command verification remain required.

## Hosted device verification and independent timer runner — 2026-11-05

The owner completed the corrected hosted Smart Life QR flow. Production now retains the encrypted connection, discovers the real DEV_19 and reads its reported humidity and power state. In-app native countdown testing returned 120 minutes after setting 2h and zero after cancellation. In-app power-off and power-on requests were acknowledged and subsequent Smart Life reads confirmed Off then On. The original On state was restored after a pause. These are provider-reported results; independent physical observation and a physical PC-off iPad check remain outstanding. The measurement sample time is still unavailable.

The timer Worker is now deployed through the official CLI, with a once-per-minute cron and no public Worker endpoint or D1 binding. This replaces the earlier design that duplicated appliance credentials into the runner. It signs timestamped requests to the fixed Pages /api/timer-runner route using a separate encrypted TALIN_TIMER_TOKEN shared with Pages. The route rejects missing/wrong/old signatures and only runs already-saved due timers. It accepts no device/action payload. The Tuya encryption key remains in Pages. Existing atomic D1 claims prevent a replay from delivering a command twice; uncertain deliveries are not retried. Both deployments stay on the existing Free plan. No Hello World Worker was deployed.

The owner approved the CLI's account-read, Worker-script-write, D1-write and background scopes. Wrangler stores its credentials encrypted, with its encryption key in Windows Credential Manager. The optional keyring package was installed from npm. A new timer credential was transferred once through a current-user-only temporary file, deleted immediately after encrypted Cloudflare storage. It was never printed or committed.

Validation: typecheck, lint, production build, 39 unit/backend tests, 12 browser tests and five real local Pages/D1 tests passed. The initial local full-stack attempt needed CHROMIUM_PATH set to the installed Chrome; the complete rerun passed. The revised Worker dry run passed, followed by deployment. Production timer heartbeat, durable countdown execution/cancellation and hardware acceptance remain to be verified before claiming full completion.

## Independent timer acceptance and TV hub preparation — 2026-11-05

The production cron heartbeat is now fresh and matches the Pages configuration. A two-minute off timer was created inside Talin, then the Talin tab was closed. D1 later recorded the timer acknowledged and Tuya acknowledged its matching off command. A subsequent household on command was also recorded, and the final provider read reported On. A second test timer was cancelled; no pending or claimed test timers remain. This proves the independent cloud dispatch and cancellation route, not a physical PC shutdown or an independently observed appliance transition. Native countdown set/cancel and direct power state reads were also verified. Cloudflare's global_fetch_strictly_public flag is explicitly enabled on the dispatcher for the fixed authenticated Pages request.

The official SmartThings CLI now lists the real OCF TV and its HUB device. The TV advertises switch plus media capabilities; this alone does not enable them in Talin. The owner approved the official CLI sign-in. Its setup files are isolated under a current-user-only directory; no SmartThings credential is copied into the app or browser storage. A separate compatible Node runtime and official CLI were installed from npm without replacing this PC's existing Node.

A read-only Edge probe has been prepared to test custom driver execution and certificate/hostname-verified outbound HTTPS on this particular TV hub. It creates only one diagnostic virtual contact sensor, opens no listener, sends no secrets or physical-device commands, and fails closed when verification methods are unsupported. Seven Lua checks cover successful verification and transport/certificate/hostname/HTTP failures. Samsung's CLI package build passed. Installation and real hub results are still pending; no TV bridge or TV controls are claimed.

## TV diagnostic installation follow-up — 2026-11-05

An owner-only driver channel was created without publishing invitations. Its usage notice links to this repository's Hub diagnostic section and creates no additional payment or agreement. Samsung rejected the initial profile category Other; the profile now uses the supported ContactSensor category with an explicit diagnostic label. The first driver version was accepted into the TV hub's installed list. Subsequent update/install requests returned 404, so runtime activation of the latest version is not claimed. The owner has been asked to run SmartThings Add device -> Scan nearby, the supported phone discovery step; no diagnostic device has appeared in the authenticated device list yet.

The CA bundle is now an included Lua module because the CLI omits loose root-level files from packages. Startup schedules creation of only the diagnostic device, and the seven security checks still pass. No tokens or appliance actions are part of this probe. The current channel version is uploaded, pending verified hub execution.

Automatic approval review rejected accepting the local debugger's unverified certificate fingerprint. No persistent trust exception was added and the debugger was stopped. Cloud device status is the safer diagnostic path; the rejected operation was not bypassed. Official CLI credentials are now encrypted with Windows DPAPI between commands inside a current-user-only setup directory. A wrapper decrypts only for an authorised CLI operation and re-encrypts refreshed credentials on exit.

The sidebar no longer states that all devices are unconnected, and the connected dehumidifier no longer shows connection-needed copy. These text changes preserve preferences. Typecheck, lint, 39 unit/backend tests, 12 browser tests, five real local Pages/D1 tests and the production build passed again. Physical Safari 15/iPad Air 2 acceptance, independent appliance observation and a physical PC-off test are still owner checks; calendars remain deferred.

## Discovery and offline-state follow-up — 2026-11-05

The owner ran phone discovery and reported a TV Zigbee issue. The LAN-only diagnostic does not use Zigbee. SmartThings now reports the latest uploaded probe version installed, but the authenticated device list still contains only the TV and hub; no diagnostic virtual device exists. This does not prove hub TLS execution or a usable TV-control bridge. Startup logs are needed to diagnose it. Access to the local debugger is pending the owner's specific approval to trust its unverified certificate; no trust exception has been added.

Smart Life now reacts immediately to browser offline events: retained readings are marked stale, power/native countdown/cloud timer controls disable, late in-flight reads cannot re-enable them offline, and returning online refreshes the connection. The browser test covers offline disabling and online recovery without extra device commands. Typecheck, lint, 39 unit/backend tests, 12 browser tests, five real local Pages/D1 tests and build passed. No preferences or saved connection were replaced.

## SmartThings-only continuation — 2026-11-05

The owner declined the local debugger certificate exception and then explicitly rejected the Alexa fallback. Neither route was used further. The certificate was never trusted and no Alexa trigger was sent or marked verified. SmartThings remains the requested TV route.

Authenticated hub metadata reports firmware 000.062.00014, LAN/Edge/local API/local virtual-device availability Available, and driver/memory limits Ok. Zigbee is Unavailable and requires external hardware on this TV; the LAN diagnostic uses no Zigbee or dongle. No hardware purchase, reset or paid API plan was attempted.

The initial probe was missing discovery permission. This was corrected using Samsung's official LAN driver example, with a fresh packageKey because permissions are immutable. Several installation requests returned NotFoundError despite successful upload/assignment; a later install of the corrected standard-capability probe succeeded. The hub then created an actual LAN diagnostic and reported Open, confirming driver execution but not verified HTTPS. The probe reports Open at startup and only reports Closed after CA, hostname and HTTP verification all succeed. A cloud-created VIRTUAL test record returned 403 but was nevertheless created by Samsung; it has no readings and is now labelled Talin setup - inactive diagnostic. No real household device was renamed.

A read-only custom diagnostic capability was registered to obtain startup stages through Samsung's authenticated cloud API. Direct updates of the service-managed VIRTUAL profile were refused, so the proper LAN driver requests its own packaged diagnostic profile update. The capability is not a sensor or power control. No paid access or certificate bypass is required. A staged version is uploaded; its runtime stage remains to be verified. The seven Lua security checks passed again.

The existing once-per-minute cloud runner now clears encrypted expired QR payloads while retaining short-term connection-attempt metadata for rate limiting; records older than a day are removed. This works even before an appliance connection exists. A test verifies active payloads are preserved and expired payload cleanup cannot reset the 15-minute attempt count. Forty unit/backend tests, typecheck and lint passed; the full-stack build/test rerun is recorded with the final release checks.
