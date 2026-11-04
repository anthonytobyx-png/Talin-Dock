# Talin Dock contributor instructions

Use the existing checkout; cloud tasks are isolated. Do not create a worktree unless the user explicitly requests one.

Read README.md, ARCHITECTURE.md and IMPLEMENTATION_STATUS.md before changing scope. Original product documents in docs/specifications are preserved; new web/cloud decisions are in ARCHITECTURE.md. Do not silently rewrite the baseline.

Use React, strict TypeScript and lightweight CSS. Target Safari 15 / 2 GB iPad Air 2; avoid unsupported browser APIs and heavy effects. Keep room layouts household-wide and preferences per profile. Minimum practical touch target is 44 CSS px. Profiles are not authentication.

Never invent live readings, device discovery or connection success. Demo adapters must be explicit and opt-in. Real adapters confirm capabilities; users may only reduce them. Never contact physical hardware without an authorised integration task. Credentials and calendar contents never belong in localStorage, VITE_* variables, fixtures, logs or commits.

No public deployment, external account creation, billable APIs, paid infrastructure or real secrets without explicit approval. The Windows PC must never be required for Home. Cloud infrastructure cannot directly discover/control LAN devices. Do not expose unauthenticated private reads/control endpoints.

Use Node 22.12+ and npm ci. Required checks for code changes: npm run typecheck, npm run lint, npm test, npm run build. UI changes also require npm run test:browser with CHROMIUM_PATH configured where necessary. Use npm run format for maintained source/config; do not format original specifications. Browser screenshots do not prove physical iPadOS 15 compatibility. Report actual checks, failures and limitations.

Before pushing, inspect git status/diff and avoid node_modules, dist, credentials and browser results. Update implementation status and home checklist when functionality changes. Do not overwrite primary branches or push generated demo data as live state.
