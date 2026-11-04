# Cloudflare deployment and account setup

## Current state

The app, Pages Functions API, D1 schema, security boundary and offline build passed the previous cloud task's checks. The desktop continuation now has signed-in Cloudflare dashboard access and a connected GitHub repository. Free D1 `talin-dock` was created in Western Europe with ID `a8e61d46-75fc-45e4-9282-a7f713dc4721`; its three application tables and session-expiry index were verified in the dashboard. The real database ID is committed in root `wrangler.jsonc`. The owner has securely saved the encrypted production password verifier. The authenticated production deployment is live and cloud revision 1 was read successfully.

The owner's latest request authorises continuing toward free Cloudflare hosting. Never activate a paid plan, add a payment method or choose a billable integration. Account authentication and any requested consent remain the owner's responsibility.

Cloudflare's official agent guide was fetched and followed in the previous cloud task. Its recovered setup and validation record appears below.

## Access prerequisites

The earlier cloud network blocker was resolved in that environment. The desktop continuation uses the signed-in Cloudflare dashboard and GitHub Pages integration; it has not authenticated local Wrangler or installed the isolated cloud task's tools on this PC.

Use Cloudflare's official agent setup flow after reading it. If using an API token instead, provide a scoped token securely in environment settings, never in chat or a tracked file. The needed operations are Pages project/deployment management, D1 database creation/migrations and account selection. Prefer a token restricted to the intended account with Pages Edit and D1 Edit, plus the read permission needed to identify that account; do not use a global API key. Verify current permission names/requirements against the official flow. An account ID is non-secret but must be selected from actual authorised accounts, not guessed.

`npm run deploy:check` reports local readiness only. It never deploys and a present token does not prove authorisation. Use `node scripts/wrangler.mjs whoami` to verify the configured identity after access is supplied. Preserve proxy authentication and TLS verification.

## Provision and deploy after account access works

Commands below are the CLI reference; desktop provisioning currently uses the dashboard and GitHub integration. The local equivalent migration, runtime and browser flows have been tested. Check current account resources first, reuse only the correct project's resources, and never overwrite unrelated projects.

1. Run `node scripts/wrangler.mjs pages project list` and `node scripts/wrangler.mjs d1 list`. If necessary set `CLOUDFLARE_ACCOUNT_ID` for the intended account only. Verify the account uses the Free plan and do not upgrade it.
2. If no project/database exists for Talin Dock, create them:

   ```sh
   node scripts/wrangler.mjs pages project create talin-dock --production-branch feat/cloud-app
   node scripts/wrangler.mjs d1 create talin-dock
   ```

   The Pages production branch names a deployment channel; this command does not create or change Git branches. If the name is taken in this account, choose and document a unique project name rather than touching another project.

3. Replace **only** the all-zero `database_id` in the root `wrangler.jsonc` with the returned real ID and set `database_name` to the verified database. The ID is not a secret. Pages requires the standard config in the project root; it rejects alternate config paths. Do not deploy the placeholder binding or the temporary test harness.
4. Run `node scripts/wrangler.mjs d1 migrations apply DB --remote`. There are no existing production rows to destroy in the initial migration. For later migrations, inspect schema changes and preserve existing data first.
5. Set a household sign-in passphrase using a trusted terminal. `npm run --silent auth:hash` reads a 12–256 character passphrase without echo and outputs only a salted PBKDF2 verifier. Pipe it directly into:

   ```sh
   npm run --silent auth:hash | node scripts/wrangler.mjs pages secret put TALIN_PASSWORD_HASH --project-name talin-dock
   ```

   Use a password manager and a long unique passphrase. Do not commit the verifier, paste it into chat or set it as a `VITE_*` variable. Preview environments also need their own correctly configured secret if sync is enabled there. Without a valid verifier and database, the API fails closed and the UI remains local-only. Rotating this verifier changes the login password; revoke existing sessions separately if access was compromised.

6. Run `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:browser` and `npm run test:cloud`. The cloud test harness creates a disposable **local** D1 database and uses a public test-only password. It never authenticates or provisions Cloudflare.
7. Run `npm run build`, then `node scripts/wrangler.mjs pages deploy dist --project-name talin-dock --branch feat/cloud-app` after all prerequisites are verified. This publishes the static assets and `functions/api/[[path]].ts`. No paid service or D1 plan change is required by this design.
8. Validate the returned actual HTTPS URL: security headers, service-worker install, online then offline reload, Monaghan weather, session status, unauthenticated API denial, real browser sign-in, saving/loading on a second browser, stale-revision conflict, logout and session revocation. Confirm `_routes.json` limits Functions execution to API paths. Record the actual URL only after successful deployment. GitHub Actions CI execution and real Cloudflare quota behaviour still need separate observation.

## Storage and security

One household uses one shared passphrase. Anyone authorised with it can read/change all cloud display preferences. Profiles remain preferences, not identity or calendar privacy. There is no public control endpoint or calendar data API.

D1 stores an allowlisted preference JSON, revision, update time, hashed opaque session tokens and login-rate-limit fingerprints. Sessions expire in seven days; logout revokes the current session. Cookie flags are Secure, HttpOnly and SameSite=Strict. Mutations require matching Origin plus a custom request header. Preference writes require `If-Match`, reject unknown/sensitive fields and cap the body at 32 KB.

Login attempts are limited per fingerprint to five per 15-minute window; server-side expiry checks do not depend on the browser. Expired session/rate rows are removed on successful login. Their rows may remain at rest until that cleanup occurs. Rotate/revoke sessions through a reviewed administrative operation if necessary; no unauthenticated reset endpoint exists. Preference backups include names and location, so handle them as household information.

No credentials or calendar content are stored in localStorage. Non-sensitive preference and weather caches remain readable to someone using the browser; signing out does not erase them. Service workers cache static same-origin assets only, never API responses, passwords or private provider data. Device controls stay disabled until real hardware capabilities and authenticated routes are implemented.

## Operating within the free tier

Static asset requests are served by Pages; Functions are reserved for `/api/*`. Weather goes directly to Open-Meteo's personal/non-commercial service and refreshes at most every 15 minutes while visible (with a cached fallback). Cloud sync is explicit, not a request on every clock tick or setting change. No paid database, ongoing PC host or credit card is part of the architecture. Provider limits/terms may change; confirm the account's actual free quotas before publication and monitor use without upgrading automatically.

## Recovered cloud setup — 2026-11-04

The prior cloud task fetched Cloudflare's official agent guide, installed 19 Cloudflare skills under `~/.agents/skills`, and registered `https://mcp.cloudflare.com/mcp` in `~/.codex/config.toml`. MCP OAuth and Wrangler authentication were still incomplete in that isolated cloud environment. The optional beta `cf` CLI was not installed. These installations do not imply installation or authentication on this Windows PC.

That task verified unrestricted HTTP reachability to Cloudflare and Open-Meteo, including real Monaghan current conditions and five forecast days. It reran `npm ci`, typecheck, lint, build, 15 unit tests, six browser tests and five local full-stack tests successfully. These are recovered historical results, not newly run Windows checks. Physical iPad/Safari validation remains outstanding.

## Desktop provisioning — 2026-11-04

- Cloudflare account: `be46faf4dc2aa5b39e703ec5103d67c1`; no existing Pages projects or D1 databases were present before setup.
- D1 dashboard reports free hard limits: 10 databases, 5 million rows read/day, 100,000 rows written/day and 5 GB total storage. No upgrade or payment method was selected.
- Initial migration SQL was executed through the D1 console, then verified via sqlite_master. Future `wrangler d1 migrations apply` can safely run the idempotent initial migration and record Wrangler migration bookkeeping; this console application did not create that bookkeeping table.
- Pages source is `anthonytobyx-png/Talin-Dock`, production branch `feat/cloud-app`, output `dist`. Build command: `npm run typecheck && npm run lint && npm test && npm run build`.
- Windows file creation failed in this chat's workspace. Source was read and the binding committed through the connected GitHub API; the production build runs in Cloudflare's build environment. No application code or dependencies changed.

- Initial production deployment succeeded at https://talin-dock.pages.dev/ from commit `0668c15`. Typecheck, lint, 15 unit tests and build passed in Cloudflare. The live dashboard showed real Monaghan weather and reported offline readiness. HTTPS responses include CSP, nosniff, no-referrer and denied camera/microphone/geolocation permissions. `/api/session` returns configured=false/authenticated=false; unauthenticated preferences reads return 503 until the verifier is configured. Authenticated sync and physical iPad checks are still pending.
- `/password-setup.html` is a browser-only administrative helper for producing the existing PBKDF2 verifier format. It makes no network requests and persists no credentials. The owner must choose the passphrase, copy its verifier into the encrypted production secret `TALIN_PASSWORD_HASH`, save and redeploy. The public test harness password must never be used.
- Build-time npm audit reported 8 moderate and 2 critical findings in development tooling (Vitest/Tinypool and typescript-eslint/minimatch). They are not runtime UI dependencies. No dependency upgrades were attempted as part of provisioning; toolchain remediation remains separate tracked work.

## Production verification — 2026-11-04

- Production URL: https://talin-dock.pages.dev/. Deployed source commit: `5f1901ab0cb50fd024ebf32dcf1fec0ea19e7f48`; secret-enabled deployment: `e56de6c6-559d-4ecd-9008-9e3ceaef83eb` (successful).
- The owner saved `TALIN_PASSWORD_HASH` as an encrypted production secret and signed in privately. No passphrase or verifier was read, logged or committed by the agent.
- Live `/api/session` reports configured=true. A separate unauthenticated client receives 401 for private preferences; a cross-origin login POST receives 403. API responses are no-store.
- The live browser shows Signed in. Read cloud copy successfully returned cloud revision 1, confirming an existing saved copy is persisted in remote D1 and readable through the authenticated API. Existing cloud/local preferences were not overwritten for verification. Second-device restore, hosted stale-write conflict and hosted logout/replayed-cookie checks remain acceptance checks; their local full-stack equivalents passed.
- GitHub Actions run 41896097954 passed typecheck, lint, build, 15 unit tests, seven browser tests and five local full-stack tests (27 tests). This includes the browser-only verifier helper test. Cloudflare's secret-enabled rebuild also passed its configured typecheck/lint/unit/build checks.
- A production-only dependency audit (`npm audit --omit=dev`) reported zero vulnerabilities. The development-toolchain findings were resolved in the final cloud review below.
- No paid plan, payment method, billable integration or PC hosting dependency was activated. Physical iPad/Safari checks and calendar/device integrations remain outside this deployment verification.

## Final cloud review — 2026-11-04

The cloud checkout was brought up to date with the desktop continuation. Independent live browser checks passed for dashboard rendering, offline readiness and offline reload; the service-worker cache contained no API paths and no page errors occurred. HTTPS/security headers, configured session status, signed-out preferences denial (401), cross-origin login denial (403) and no-store API responses were verified again.

Development-toolchain advisories were resolved by moving Vitest to 5.1.0 and overriding minimatch to 11.0.4 or later only within typescript-estree. The latter still uses the supported `minimatch()` interface; remove this narrow override when its upstream dependency is patched. Full npm audit reports zero vulnerabilities. Typecheck, lint, build and all 27 local tests pass. No application source, production secret, schema or household preferences changed in this review. The existing GitHub-connected Pages pipeline deploys pushes to `feat/cloud-app`; no separate Cloudflare CLI login is needed for that path.

Physical iPad installation/performance checks and owner-authenticated second-device acceptance remain the final manual checks. The isolated cloud browser does not inherit the Windows browser's household session.
