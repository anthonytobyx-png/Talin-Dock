# Home setup checklist

## Verified PC and second Windows account — 5 November 2026

- Anthony's companion is paired in production and starts at Windows sign-in under his own account. The deployed Computer page received real CPU/memory/NVIDIA/audio reports. A production UI volume request was acknowledged with the starting 82% level retained. Home data and the existing Smart Life connection were preserved. The initial computer implementation/deployment and Windows CI passed all 65 app checks plus native audio/queue tests.
- The owner requested the same setup for the second account, Barbara. It has a separate cloud identity; no Anthony credential is copied. Barbara's profile is not loaded. Current non-elevated Windows permissions prevent installing her startup shortcut. A reviewed administrator installer and windowless shared runtime are prepared; administrator approval remains needed to write the protected startup folder. Do not claim Barbara is connected or hardware-tested yet.
- The second-account bootstrap is Windows-machine encrypted, stored in a protected directory and bound in the companion to Barbara's exact Windows SID. The administrator installer restricts its runtime to administrator writes and its bootstrap to that account/admin/SYSTEM. At her next normal sign-in, the companion seals its own credential with CurrentUser DPAPI and consumes the bootstrap. Tests rejected the wrong SID and a broadly readable output directory, and verified successful user-bound sealing/consumption with a separate local fixture. No account password, registry hive, private files or browser credentials were extracted.
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

Do not send tokens, pairing keys or private calendars in chat. Phase 1 needs none. Collect non-sensitive observations first; use secure settings for credentials only once a reviewed integration exists.

- Validation: typecheck, lint, build, 40 unit/backend, 12 browser, 5 local Pages/D1 and 27 public Lua diagnostic checks passed. The initial sandboxed Vitest run failed on filesystem realpath permissions; the authorised rerun outside that sandbox passed.

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

Dehumidifier identity supplied by owner: Devology Virgo-RCS12(y)-N7-1, SKU DEV_19. No further model identification is needed. Remaining checks concern authenticated live humidity, data-point mapping/units, reporting timestamps and stale/offline behaviour. Do not infer these from another brand's Virgo manual or enable appliance controls.

Power and timers are now within the owner's requested scope. Once a real route is available, verify on/off acknowledgements against physical state, test a short countdown on the device/service with Safari closed and this PC off, refresh the schedule after reopening, cancel it, and confirm offline/timeout outcomes. Restore original power/settings where practical. No control may be enabled solely because it is listed in marketing material.

## Alexa routine mapping still required

The four Talin doorbells are only triggers. In Alexa use More -> Routines -> +, then select the matching Talin doorbell pressed event under When and the REAL appliance's Smart Home Power On/Off under Actions. Do not use the virtual doorbell itself as the action. Start with Talin Dehumidifier On, save and Play; only after actual operation create/test the other three mappings. The browser Alexa session can list devices but refused routine creation. The owner's native Alexa device buttons work, while external triggers previously acknowledged success without changing either appliance. No Talin action is verified yet.

The owner approved encrypted Cloudflare credential storage and asked to retain the existing trigger links. Never share those links. After verified mappings, enable only physically tested actions; test cloud countdowns with this PC off and Safari closed. The separate runner must be provisioned and healthy first. Humidity and power-state telemetry are still unconnected and must not be inferred from routine acknowledgements. Calendars remain deferred by the owner.

## Direct Smart Life continuation

Use Devices -> Smart Life connection in the hosted app once the new code is deployed. The setup page explains use of the public Home Assistant registration and encrypted Cloudflare credential storage before the user enters the User Code or approves Tuya's QR. Keep credentials out of chat. The prior local read-only QR probe deliberately retained none. Do not imply it connected the production app.

Only DEV_19's discovered Boolean switch, indoor humidity and cancel/2h countdown are implemented. Validate actual on/off and state updates against the appliance. Test/cancel the native countdown while powered on before relying on its behaviour. Humidity's device sample time is unavailable; compare with Smart Life/display and retain that label instead of treating device metadata time or HTTP retrieval time as a sensor timestamp.

The TV's hub is now registered and advertises Edge/local API/virtual-device support. Further work must establish an authenticated, free route from hosted Talin through that hub, confirm the hub remains operational with the screen off, and test physical results. Do not install unauthenticated HTTP control drivers or presume the advertised local API is directly callable from Safari.

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
