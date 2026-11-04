# Cloudflare deployment and account setup

## Current state

The app, Pages Functions API, D1 schema, security boundary and offline build are implemented and tested locally. No Cloudflare account is authenticated in this environment. No cloud database, Pages project, public URL or production password has been created.

The owner's latest request authorises continuing toward free Cloudflare hosting. Never activate a paid plan, add a payment method or choose a billable integration. Account authentication and any requested consent remain the owner's responsibility.

The requested guide is https://developers.cloudflare.com/agent-setup/prompt.md. Fetching it was blocked by the environment's enforced network policy (HTTP proxy 403). It has **not been read or executed**. Fetch and follow its applicable account setup instructions once network access is active; do not substitute these local instructions for claiming that guide completed.

## Access prerequisites

Environment settings contain a saved draft with custom domains `developers.cloudflare.com`, `api.cloudflare.com`, `api.open-meteo.com`, `geocoding-api.open-meteo.com` and `open-meteo.com`, plus a `CLOUDFLARE_API_TOKEN` proxy-secret requirement for `api.cloudflare.com`. Saving that draft does not apply it automatically. The live environment must report the domains enforced and credential ready, and the actual operation must succeed.

Use Cloudflare's official agent setup flow after reading it. If using an API token instead, provide a scoped token securely in environment settings, never in chat or a tracked file. The needed operations are Pages project/deployment management, D1 database creation/migrations and account selection. Prefer a token restricted to the intended account with Pages Edit and D1 Edit, plus the read permission needed to identify that account; do not use a global API key. Verify current permission names/requirements against the official flow. An account ID is non-secret but must be selected from actual authorised accounts, not guessed.

`npm run deploy:check` reports local readiness only. It never deploys and a present token does not prove authorisation. Use `node scripts/wrangler.mjs whoami` to verify the configured identity after access is supplied. Preserve proxy authentication and TLS verification.

## Provision and deploy after account access works

Commands below describe the production steps; they have not been run against a cloud account. The local equivalent migration, runtime and browser flows have been tested. Check current account resources first, reuse only the correct project's resources, and never overwrite unrelated projects.

1. Run `node scripts/wrangler.mjs pages project list` and `node scripts/wrangler.mjs d1 list`. If necessary set `CLOUDFLARE_ACCOUNT_ID` for the intended account only. Verify the account uses the Free plan and do not upgrade it.
2. If no project/database exists for Talin Dock, create them:

   ```sh
   node scripts/wrangler.mjs pages project create talin-dock --production-branch main
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
7. Run `npm run build`, then `node scripts/wrangler.mjs pages deploy dist --project-name talin-dock --branch main` after all prerequisites are verified. This publishes the static assets and `functions/api/[[path]].ts`. No paid service or D1 plan change is required by this design.
8. Validate the returned actual HTTPS URL: security headers, service-worker install, online then offline reload, Monaghan weather, session status, unauthenticated API denial, real browser sign-in, saving/loading on a second browser, stale-revision conflict, logout and session revocation. Confirm `_routes.json` limits Functions execution to API paths. Record the actual URL only after successful deployment. GitHub Actions CI execution and real Cloudflare quota behaviour still need separate observation.

## Storage and security

One household uses one shared passphrase. Anyone authorised with it can read/change all cloud display preferences. Profiles remain preferences, not identity or calendar privacy. There is no public control endpoint or calendar data API.

D1 stores an allowlisted preference JSON, revision, update time, hashed opaque session tokens and login-rate-limit fingerprints. Sessions expire in seven days; logout revokes the current session. Cookie flags are Secure, HttpOnly and SameSite=Strict. Mutations require matching Origin plus a custom request header. Preference writes require `If-Match`, reject unknown/sensitive fields and cap the body at 32 KB.

Login attempts are limited per fingerprint to five per 15-minute window; server-side expiry checks do not depend on the browser. Expired session/rate rows are removed on successful login. Their rows may remain at rest until that cleanup occurs. Rotate/revoke sessions through a reviewed administrative operation if necessary; no unauthenticated reset endpoint exists. Preference backups include names and location, so handle them as household information.

No credentials or calendar content are stored in localStorage. Non-sensitive preference and weather caches remain readable to someone using the browser; signing out does not erase them. Service workers cache static same-origin assets only, never API responses, passwords or private provider data. Device controls stay disabled until real hardware capabilities and authenticated routes are implemented.

## Operating within the free tier

Static asset requests are served by Pages; Functions are reserved for `/api/*`. Weather goes directly to Open-Meteo's personal/non-commercial service and refreshes at most every 15 minutes while visible (with a cached fallback). Cloud sync is explicit, not a request on every clock tick or setting change. No paid database, ongoing PC host or credit card is part of the architecture. Provider limits/terms may change; confirm the account's actual free quotas before publication and monitor use without upgrading automatically.
