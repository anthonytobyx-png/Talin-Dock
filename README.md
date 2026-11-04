# Talin Dock

A calm, touch-first household dashboard for an iPad Air 2. Phase 1 is a real React/TypeScript web application: profiles, room selection, widget visibility, navigation and local preferences work. Devices and accounts are deliberately **not connected**.

## Develop

Use Node 22.12+ (validated here with Node 24.22.1) and npm.

```sh
cd /workspace/Talin-Dock  # or your checkout directory
npm ci
npm run dev -- --port 5173 --strictPort
```

Open the development server in your normal development browser. `npm run build` produces `dist/`; `npm run preview -- --port 4173 --strictPort` serves that production output. No secrets, database, background services or household computers are required.

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run test:browser
```

Browser tests use `/usr/bin/chromium` in this cloud environment. Elsewhere set `CHROMIUM_PATH` to your browser executable, or install Chromium using Playwright and set that path. Screenshots are generated in ignored `test-results/`. Unit tests are deterministic and never contact hardware. Run `npm run format` to format maintained code; preserved product specifications are excluded.

## What you can use

- Home, Devices, Remote, Calendars, Media, Voice, Computer, Display and Settings navigation.
- Desk, Kitchen and Bedroom dashboards; shared per-room widget visibility.
- Household, Anthony and Bárbara profiles, editable personal names, themes, time format, calendar visibility preferences and device favourites.
- Local persistence, with malformed-storage recovery and visible write-failure feedback.
- Clock/date from the browser's local time; manual ambient clock dialog from Quick actions.
- Official media website links and explicit App Store links. iPadOS controls any native app hand-off.

The weather and calendar cards provide setup states, not live content. Samsung and Tuya adapters return typed not-configured errors. The demo adapter is an isolated test/development fixture and is never enabled in the application. See [implementation status](IMPLEMENTATION_STATUS.md).

## Cloudflare free-tier deployment preparation

No public deployment or external account changes have been performed. Once the owner approves deployment, use a Cloudflare Pages **Free** project connected to this GitHub repository:

- Framework: Vite; build command: `npm run build`; output directory: `dist`.
- Root directory: repository root; Node version: 24 (or supported 22.12+).
- No variables, secrets, Functions, D1, paid plans or credit-card integrations are needed.
- `wrangler.jsonc` describes the Pages output for optional future CLI use. Wrangler is not needed for local development and is not installed.
- `public/_headers` supplies CSP and security headers on Pages; Vite preview does not apply them. Confirm those headers on an approved deployment before adding account integrations.
- Keep production builds only; Vite development uses tooling that is not compatible with the production CSP.

Pages can serve this static foundation without an always-on PC. Free-tier quotas and provider terms should be checked before deployment; avoid upgrades and paid features. Sensitive APIs are absent. Before adding any private calendars or control endpoints, implement authenticated server-side household membership and authorisation, secure token storage and revocation.

## iPad installation and limits

Once an HTTPS deployment is approved and available, open in Safari and use Share → Add to Home Screen. A manifest and standalone Apple metadata are included. A PNG Apple touch icon is supplied. This is an online-first installable web foundation: **there is no service worker or offline reload support yet**. An already-open page retains its clock and local settings when the network disappears. Full-screen launch, app hand-off, performance and actual iPadOS 15 behaviour still need physical-device testing.

No access to the iPad calendar store, LAN discovery, wake lock, kiosk relaunch, USB transport or display streaming is implied. Original design artboards and screenshots were unavailable; no visual-fidelity claim is made.

Original documents are preserved under [docs/specifications](docs/specifications/PRODUCT_SPECIFICATION.md). Read [architecture](ARCHITECTURE.md), [home checklist](HOME_SETUP_CHECKLIST.md) and [next steps](NEXT_STEPS.md) before integration work.
