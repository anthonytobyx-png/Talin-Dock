# Talin Dock contributor instructions

Use the existing checkout; cloud tasks are isolated. Do not create a worktree unless the user explicitly requests one.

Read README.md, ARCHITECTURE.md and IMPLEMENTATION_STATUS.md before changing scope. Original product documents in docs/specifications are preserved; new web/cloud decisions are in ARCHITECTURE.md. Do not silently rewrite the baseline.

Use React, strict TypeScript and lightweight CSS. Target Safari 15 / 2 GB iPad Air 2; avoid unsupported browser APIs and heavy effects. Keep room layouts household-wide and preferences per profile. Minimum practical touch target is 44 CSS px. Profiles are not authentication.

Never invent live readings, device discovery or connection success. Demo adapters must be explicit and opt-in. Real adapters confirm capabilities; users may only reduce them. Never contact physical hardware without an authorised integration task. Credentials and calendar contents never belong in localStorage, VITE_* variables, fixtures, logs or commits.

No public deployment, external account creation, billable APIs, paid infrastructure or real secrets without explicit approval. The Windows PC must never be required for Home. Cloud infrastructure cannot directly discover/control LAN devices. Do not expose unauthenticated private reads/control endpoints.

Use Node 22.12+ and npm ci. Required checks for code changes: npm run typecheck, npm run lint, npm test, npm run build. UI changes also require npm run test:browser with CHROMIUM_PATH configured where necessary. Use npm run format for maintained source/config; do not format original specifications. Browser screenshots do not prove physical iPadOS 15 compatibility. Report actual checks, failures and limitations.

Before pushing, inspect git status/diff and avoid node_modules, dist, credentials and browser results. Update implementation status and home checklist when functionality changes. Do not overwrite primary branches or push generated demo data as live state.

Cloud continuation: the owner authorised free Cloudflare hosting/database preparation and selected Monaghan, Ireland, while retaining Google/iCloud/Outlook calendar options. Verify authentication in the active environment; no paid plans or home-network device work without explicit permission. Read DEPLOYMENT.md for current provisioning status. The previous cloud task fetched the guide and installed skills/MCP registration; OAuth was pending there. Read DEPLOYMENT.md for the current hosted status.

Run `npm run test:cloud` for backend/offline changes in addition to the existing checks. It starts real local Pages Functions and a disposable D1 database with a test-only verifier. Never deploy its generated config/password. Use the root wrangler.jsonc for Pages; alternate config paths are unsupported. Use scripts/wrangler.mjs for local commands so logs remain in ignored .wrangler. Ignore .dev.vars and runtime databases. Server secrets never use VITE_* names. Cloud preference writes require revision matching and explicit overwrite confirmation; API responses must never enter offline caches.
