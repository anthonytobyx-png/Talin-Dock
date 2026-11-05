# Selected architecture

## Decisions made in Phase 1

These decisions implement the owner's new web/cloud brief; the original specification remains unchanged as a historical baseline.

| Area                | Decision and implication                                                                                                                                                                                                                                                                                                         | Original questions |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| Runtime             | React 18, strict TypeScript, Vite; static Cloudflare Pages free-tier deployment prepared. No PC host dependency.                                                                                                                                                                                                                 | Q-1                |
| Styling             | Local CSS, system fonts, SVG icons; Safari 15 compilation target; no animation loops, large images, external fonts or backdrop blur.                                                                                                                                                                                             | SR-ENV-1           |
| State               | Reducer + context; versioned, allowlisted localStorage repository for non-sensitive UI preferences only. Provider interface can be replaced without changing components. No cross-device sync or power-loss durability guarantee.                                                                                                | Q-11               |
| Profiles            | Shared Household plus two configurable personal profiles. Theme/time/visibility/favourites are separate from household layouts. No authentication or privacy claim.                                                                                                                                                              | Q-7, Q-21, Q-34    |
| Layout              | Ordered per-room widget lists; fixed responsive sizes, no dense packing. Visibility is implemented; resizing and reordering deferred.                                                                                                                                                                                            | Q-20               |
| Device capabilities | Integrations confirm capabilities; users can only hide them. Commands require confirmed capability, control access, online status and a fresh timestamp. Default freshness is five minutes, provisional pending route measurements.                                                                                              | Q-3, Q-4, Q-31     |
| Hardware            | Instance IDs, room assignment, route ID, model, status, access, timestamps, readings and errors. Samsung and Tuya records are unconfigured examples with zero confirmed capabilities. No hardware requests.                                                                                                                      | Q-5, Q-6, Q-37     |
| Transport           | Separate cloud/local/demo adapter kinds; async discovery, pairing, reads and commands use typed results and AbortSignal. Shared command boundary rejects unsupported or stale commands, catches failures and applies a five-second deadline. No automatic retries of state-changing commands; future reads need bounded backoff. | SR-NET-4           |
| Calendars           | Provider-based architecture; direct OS calendar-store access is unavailable on the web. No calendar content, tokens, writes or private API endpoints yet.                                                                                                                                                                        | Q-9, Q-27, Q-30    |
| Weather             | Provider contract and explicit loading, not-configured, unavailable, empty, ready and stale resource states. Source and location still undecided; no fabricated values or billable API.                                                                                                                                          | Q-10               |
| Database            | D1 is unnecessary until authenticated cloud persistence is justified. No database or server introduced.                                                                                                                                                                                                                          | Q-11               |
| Media               | Official HTTPS website links; iPadOS may hand off to installed apps. Explicit store links; no fabricated availability or success detection.                                                                                                                                                                                      | Q-13, Q-19, Q-25   |

## Code boundaries

- `src/components`: reusable panels, modal with focus handling, resources, device cards.
- `src/pages`: dashboard, settings and other sections.
- `src/state`: typed preferences, pure reducer, replaceable storage repository and React binding.
- `src/devices`: registry, normalised device model and capability/read freshness logic.
- `src/integrations`: contracts, guarded command boundary, unavailable real-route adapters and an isolated deterministic demo fixture.
- `src/data`: replaceable weather/calendar provider contracts and resource states.
- `src/tests`, `tests`: unit and browser verification.

There is no backend in Phase 1. Future authenticated cloud routes may use Workers and optional D1. Server-side code must authenticate every read and command, enforce household membership and provider scopes, store/revoke credentials securely, prevent arbitrary destination requests and keep logs free of personal event content. Frontend capability guards are UX protection, never server authorisation.

## Explicit requirement revisions and unsolved tradeoffs

1. SR-CAL-1–5 and calendar acceptance criteria must use provider authorisation instead of native calendar-store permissions. Provider choice and privacy policy remain open; no event data is fetched.
2. SR-NET-1 and local routes require an optional low-power home bridge or another authorised LAN component. Cloudflare cannot discover or directly reach LAN devices through the router. No port forwarding should be assumed. Future bridge design must cover trust, outbound connection authentication, HTTPS/CORS and revocation.
3. SR-ENV-4, SR-BG-2 and humidity-history requirements are not fulfilled by an online-only static client. There is no service worker; cold offline launch is unsupported. No cloud-only design guarantees local control during internet outages or continuous collection while iPad Safari is suspended.
4. localStorage can be evicted, blocked or cleared and does not guarantee immediate-power-loss durability (SR-DATA-1). Data is per browser/origin. There is no backup, migration from other origins or multi-tab conflict resolution yet. Existing invalid snapshots recover to defaults; future schema versions need explicit migration.
5. Web app launching cannot reliably check installed applications or confirm native launch success. Explicit website/store choices replace automatic availability detection for now.
6. A manifest is not kiosk management. Safari 15 has no dependable web wake-lock solution; power/display settings and restart recovery require home testing. No automated ambient/idle return or native brightness control is implemented.
7. No production speech processing, companion service, USB transport, mixer or display hand-off is implemented. Sidecar is unavailable on iPad Air 2. These remain later phases.

Original unresolved questions remain in `docs/specifications/OPEN_QUESTIONS.md`; the decisions above do not settle provider access terms, actual device capabilities or target-device performance. Visual comparison requires the original Main.dc.html and Portrait.dc.html or screenshots.

## Cloud-app continuation: decisions superseding Phase 1

The owner authorised continuing toward a complete free hosted app and selected Monaghan town, Ireland for initial weather, retaining Google, iCloud and Outlook calendar options. The earlier Phase 1 description above is historical. These changes supersede its offline, database, weather and layout deferrals:

- Cloudflare Pages remains the host; Pages Functions implement `/api/*`, and D1 is now justified for shared preferences and session/revision metadata. The free remote D1 database is now provisioned; see DEPLOYMENT.md for deployment status. Local D1/Functions are implemented and tested, not mocked.
- Shared household sign-in is a real access boundary for cloud preferences. Personal profiles still are not separate identities. Private calendars/device control are absent, rather than being protected only by profile switches.
- D1 stores allowlisted preferences, monotonically incremented revisions, hashed seven-day opaque sessions and rate-limit fingerprints. Origin/custom-header checks, schema/body limits and optimistic concurrency protect mutations. See DEPLOYMENT.md for threat model, retention and production prerequisites.
- Weather uses the free personal/non-commercial Open-Meteo endpoint, client-side, with explicit town coordinates (no geolocation permission). Monaghan town centre defaults to approximately 54.2489, -6.9683. A geocoder permits other towns. Forecasts refresh every 15 minutes while visible and on return/online; stale cached data is labelled. There are no provider keys or random readings.
- A build-generated service worker precaches hashed public assets and the shell. Its cache version includes the asset list, HTML template and public icon/manifest contents. It excludes all API and third-party requests. New versions wait for an explicit Update app action; first installation does not reload the page. Cache persistence is still subject to Safari eviction.
- Widget visibility, order and size are persisted household-wide; DOM order remains authoritative, with no dense packing. Backup/restore uses the same allowlisted decoder, with review before replacement. Existing version-1 snapshots gain defaults for new fields without discarding their old settings.
- Idle return is optional per profile: pointer, keyboard and scrolling activity reset its ten-minute timer; returning from a long background suspension checks the deadline. It is convenience, not access control. Automatic ambient/dimming remains deferred.
- Calendar options explain provider-specific prerequisites. OAuth registration/consent (Google/Microsoft), encrypted CalDAV/app-password handling (iCloud), server-side sharing/privacy and actual calendar adapters are not implemented. No calendar content is fetched or cached.

Cloudflare's requested guide was fetched in the prior cloud task; skills/MCP registration succeeded while OAuth remained pending there. The desktop continuation uses the owner's signed-in dashboard and repository connection. No paid plan, payment method or hardware integration is authorised.

## Shared power/timer contract

Power and timers are reusable capabilities, not assumptions derived from a device category. The new timer adapter contract requires durable create/list/cancel operations and receipts identifying the executor (device or online service), scheduled action and UTC due time. The browser does not implement delivery with a timeout or persist credentials/timer truth in preferences. An authenticated real route and independently verified capabilities are prerequisites. A future durable cloud implementation must enforce household ownership, validate commands server-side, use idempotency, reconcile uncertain acknowledgements and report actual execution separately from schedule acceptance.

## Free Alexa route and durable countdowns

Talin can use the existing Alexa manufacturer links through Virtual Smart Home URL Routine Trigger. Each of the four doorbells needs an Alexa routine mapping its pressed event to a real device's Smart Home power action. There is no everyday app handoff: the intended route is authenticated Talin Pages Function -> HTTPS trigger -> Alexa routine -> manufacturer cloud -> appliance. This uses no LAN inbound endpoint or PC bridge, but needs internet. The routine mapping has not yet been physically validated; successful webhook acknowledgements alone did not operate either appliance during the first test.

This is a command-only route. It cannot report appliance online status, current power, humidity, or execution success. The UI therefore does not mark hardware online or fabricate fresh sensor timestamps. Humidity still requires a separate, legitimately authorised Tuya telemetry integration. Existing Siri actions confirm native Smart Life control but are not evidence of a callable web telemetry API.

Countdown delivery is a separate scheduled Free Worker using the same D1 database, not a browser timeout. server/timers.ts claims each due row once before dispatch; interrupted claims become unknown rather than being replayed. Late schedules expire, cancellation races are resolved by an atomic pending-state update, and creation is blocked unless the runner heartbeat/configuration match. No public Worker HTTP control endpoint is exposed. See DEPLOYMENT.md for provisioning and outstanding acceptance checks.

## Direct Tuya data and controls

A shared ephemeral resource fetches the authenticated device-sharing API once per minute while visible/online and on return. D1 caches allowlisted readings for 30 seconds to bound repeated browser requests. Retrieval time is transport metadata, not a sensor measurement timestamp. No private API responses are service-worker cached or written to localStorage. Signing out clears the private resource; in-flight old-session responses are ignored.

Tuya credentials and pending consent state are AES-GCM encrypted in separate D1 tables using an encrypted production key. Connection-token refresh uses a per-connection lease and revision guard. Power commands and timers have durable request IDs and uncertain outcomes are not retried. Only the discovered appliance and an explicit command allowlist can be addressed. The SDK protocol is MIT-licensed; its public Home Assistant client identity is disclosed at consent. This is a compatibility integration, not a newly registered/certified Tuya commercial app.

## Hosted device verification and independent timer runner — 2026-11-05

The owner completed the corrected hosted Smart Life QR flow. Production now retains the encrypted connection, discovers the real DEV_19 and reads its reported humidity and power state. In-app native countdown testing returned 120 minutes after setting 2h and zero after cancellation. In-app power-off and power-on requests were acknowledged and subsequent Smart Life reads confirmed Off then On. The original On state was restored after a pause. These are provider-reported results; independent physical observation and a physical PC-off iPad check remain outstanding. The measurement sample time is still unavailable.

The timer Worker is now deployed through the official CLI, with a once-per-minute cron and no public Worker endpoint or D1 binding. This replaces the earlier design that duplicated appliance credentials into the runner. It signs timestamped requests to the fixed Pages /api/timer-runner route using a separate encrypted TALIN_TIMER_TOKEN shared with Pages. The route rejects missing/wrong/old signatures and only runs already-saved due timers. It accepts no device/action payload. The Tuya encryption key remains in Pages. Existing atomic D1 claims prevent a replay from delivering a command twice; uncertain deliveries are not retried. Both deployments stay on the existing Free plan. No Hello World Worker was deployed.

The owner approved the CLI's account-read, Worker-script-write, D1-write and background scopes. Wrangler stores its credentials encrypted, with its encryption key in Windows Credential Manager. The optional keyring package was installed from npm. A new timer credential was transferred once through a current-user-only temporary file, deleted immediately after encrypted Cloudflare storage. It was never printed or committed.

Validation: typecheck, lint, production build, 39 unit/backend tests, 12 browser tests and five real local Pages/D1 tests passed. The initial local full-stack attempt needed CHROMIUM_PATH set to the installed Chrome; the complete rerun passed. The revised Worker dry run passed, followed by deployment. Production timer heartbeat, durable countdown execution/cancellation and hardware acceptance remain to be verified before claiming full completion.
