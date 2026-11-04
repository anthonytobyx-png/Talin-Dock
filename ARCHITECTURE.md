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
