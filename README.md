# Talin Dock

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

A touch-first household dashboard for iPad Air 2, built with React, TypeScript and Vite. Home works independently of household computers. The app now includes live-provider weather, offline shell caching, editable layouts, local backups and authenticated Cloudflare D1 sync code.

## Run locally

Use Node 24 (`.nvmrc`) and npm:

```sh
npm ci
npm run dev -- --port 5173 --strictPort
```

This starts the frontend. Weather defaults to Monaghan, Ireland and uses Open-Meteo without an API key. The location picker supports other towns. The frontend alone keeps preferences locally; cloud storage reports unavailable until served with the API.

For the full local Cloudflare runtime:

```sh
npm run build
npm run db:migrate:local
# Optional: create .dev.vars from .dev.vars.example and set a password verifier
# generated by npm run auth:hash in a trusted terminal. Never use a plain password.
npm run dev:cloud
```

Wrangler binds only to loopback for local full-stack development. It stores its local database/logs in ignored `.wrangler/`. No cloud account, real household devices or paid service is needed for local testing. Without a verifier, the API fails closed and the dashboard still works locally.

## Checks

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run test:browser
npm run test:cloud
npm run deploy:check
```

Browser checks use `/usr/bin/chromium` or `CHROMIUM_PATH`. `test:cloud` uses Cloudflare's actual local runtime and a fresh disposable D1 database; its deterministic test-only password is never deployed. Screenshots and test outputs are ignored. Unit/browser weather fixtures are explicit tests, not application demo data. `npm run format` formats maintained code and leaves original specifications intact.

## Working features

- Nine sections, Home/Computer accents, responsive sidebar/portrait rail.
- Device-local clock/date; Desk, Kitchen and Bedroom widgets with persistent visibility, order and size.
- Household plus two renameable personal profiles; separate themes, clock formats, favourites and future calendar visibility. Optional ten-minute idle return.
- Live Open-Meteo current weather and five-day forecast; location search, loading/error/stale states and cached fallback. One shared refresh per app, paused while hidden.
- Export/import of allowlisted non-sensitive preferences, with confirmation before restoration.
- Cloud storage UI and deployed Pages Functions/D1 API: shared household login, rate limits, seven-day revocable cookies, schema/body limits and revision conflicts. Production sign-in is configured.
- Installable manifest, standard icons, offline static shell and explicit app-update action. APIs are never service-worker cached.
- Media service website links and explicit App Store choices; iPadOS decides any native app hand-off.

## Hosting

Selected host: **Cloudflare Pages Free + Pages Functions + D1 Free**. Live dashboard: https://talin-dock.pages.dev/. A free D1 database is provisioned. Household cloud sign-in is configured and an authenticated read of cloud revision 1 has been verified; see DEPLOYMENT.md. See [DEPLOYMENT.md](DEPLOYMENT.md) for setup history, tested commands and remaining device acceptance checks. The root Wrangler config now binds the provisioned D1 database. No paid service or PC host is needed.

The prior cloud task fetched Cloudflare's official guide, installed skills and registered MCP. Those environment-specific setup and validation results are preserved in DEPLOYMENT.md.

## iPad and integration limits

Once deployed over HTTPS, open in Safari and choose Share → Add to Home Screen. Offline launch is available after a successful online cache installation; Safari may still evict site storage. The clock, layouts and preferences work offline; weather falls back to dated cached data, and cloud/device connections need a network. There is no promise of offline LAN control or background collection.

Smart Life has a confirmed direct cloud route for the DEV_19 dehumidifier, described above. Samsung now has authenticated hub power/timers, pending the owner’s iPad certificate pairing and end-to-end acceptance. Google, iCloud and Outlook are represented as calendar provider options but no account is connected. The web app cannot access the native iPad calendar store. Voice, companions, USB, display streaming and automatic kiosk relaunch remain outside this hardware-independent phase.

Original artboards/screenshots were not supplied; visual comparison and physical Safari/iPad performance tests are still required. The original five documents remain byte-for-byte in [docs/specifications](docs/specifications/PRODUCT_SPECIFICATION.md). Read [architecture](ARCHITECTURE.md), [status](IMPLEMENTATION_STATUS.md) and the [home checklist](HOME_SETUP_CHECKLIST.md).

## Hub diagnostic

The owner-only SmartThings driver channel contains a read-only [hub HTTPS probe](integrations/smartthings-probe/README.md). Its notice describes the exact diagnostic, with no additional agreement, subscription or payment. No invitations are published. It is not a completed TV adapter and does not enable TV controls. The production Smart Life adapter is separate.
