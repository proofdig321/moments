# Inventory: missing pages, APIs, and infrastructure gaps

Repository: prooftv/whatsapp (branch: `main`)

Summary: first-pass audit of present components and prioritized missing items for Amazon Q to action. Each item below points to exact files or locations to inspect/modify.

1) Present / confirmed components
- Admin dashboard UI (single-page admin app): `public/index.html` and `public/admin.html` (admin UI assets live in `public/js/admin.js`).
- Express API server: `src/server.js` (serves static PWA, mounts `/admin`, webhook endpoints, health checks).
- Webhook handling and inbound processing: `src/webhook.js` (processing, MCP advisory call, media handling, n8n trigger stub).
- Auth helpers and RBAC hooks: `src/auth.js` (token parsing, role lookup via `admin_roles`).
- Supabase SQL / schema artifacts: `supabase/` (multiple `.sql` including `schema.sql`, `moments-schema.sql`, `rbac.sql`).
- n8n workflows and local compose: `n8n/` and `n8n-local/docker-compose.yml` (workflows exist but webhook trigger is currently disabled in code).
- Misc infra scripts: several `scripts/*` (e.g., `scripts/create_storage_bucket.js`, `scripts/seed_superadmin.sh`, `deploy-*` scripts) and `mcp/` integration docs.
- Tests: `tests/` contains many test files (smoke, integration, webhook, etc.).

2) Immediate missing pages (P0)
- Public user-facing landing and app: there is no implemented Next.js app or user-facing SPA. `frontend/routes_map.md` documents a Next.js App Router structure but the repository does not contain `app/` or Next.js source files. Action: implement the Next.js app or reconcile the documented routes with the existing Express + static `public/` approach.
  - Expected pages (not present): onboarding/login/signup, conversation list, messaging UI (inbox + chat thread), user settings, user preferences, moments feed for subscribers, public landing with subscribe CTA.
  - Files to create: per `frontend/routes_map.md` → `app/` tree with `page.tsx` files, or equivalent `public/` static pages plus client JS.

- PWA-ready authenticated user shell: `public/manifest.json` exists but there is no authenticated user app to consume it (only admin UI). Confirm expected `start_url` and add user app entry.

3) API and backend gaps (P0/P1)
- Missing documented or implemented HTTP APIs for user messaging flows: while there is internal broadcast logic and some admin routes, there is no clearly implemented public API for user conversation session management or send-message endpoints for the frontend to use. Inspect `src/` for `broadcast.js`, `admin.js`, and `advisory.js` for hooks.
- Next.js-style `/api/...` routes referenced in `frontend/routes_map.md` are absent. Either implement these (Next.js) or provide Express equivalents and document routes in `inventory.md`.
- Webhook resiliency: `src/webhook.js` processes inbound messages but:
  - `triggerN8nWorkflow` is stubbed (returns early) — n8n integration must be enabled or replaced with robust retryable job dispatch.
  - HMAC verification exists in `src/server.js` but verify behavior in real deployments and ensure `WEBHOOK_HMAC_SECRET` + `INTERNAL_WEBHOOK_SECRET` are provisioned.

4) Message storage and media (P0)
- `src/media.js` referenced by `src/webhook.js` — verify media storage path and that `scripts/create_storage_bucket.js` is run in each environment. Confirm bucket names and permissions in `config/supabase.js`.
- Migration coverage: several SQL files exist in `supabase/` but no single canonical migration runner or `migrations` directory. Add migration runner or clear order to apply SQL in CI/deploy.

5) Auth, RBAC, and seeds (P0)
- `src/auth.js` expects `admin_roles` table and Supabase auth. There is `RBAC_SETUP.md` and `supabase/rbac.sql` but:
  - Confirm seed script `scripts/seed_superadmin.sh` works and documents required env vars.
  - Add a sample `.env.example` listing required envs: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `WEBHOOK_HMAC_SECRET`, `INTERNAL_WEBHOOK_SECRET`, `SENTRY_DSN`, `ADMIN_ORIGIN`, `NODE_ENV`.

6) CI/CD, deployments and runbooks (P1)
- No `.github/workflows` found in the repository root (no CI defined). Add GitHub Actions to run tests, lint, and build; add PR check for integration tests. (There are deployment scripts: `deploy-vercel.sh`, `deploy-staging.sh`, `mcp-railway/`, `railway.json` — verify them.)
- Deployment env docs exist (`DEPLOY.md`, `DEPLOYMENT.md`, `VERCEL_ENV.md`) but standardize an `env.example` and a `deploy-checklist.md` that Amazon Q can follow.

7) PWA & offline (P2)
- `public/sw.js` exists but must be reviewed for caching strategies (API vs media). Confirm offline UX for user app once user pages are implemented.

8) Monitoring, logging, secrets (P1)
- Sentry integration is optional in `src/server.js` and `src/auth.js`. Confirm `SENTRY_DSN` usage and add a Sentry test project in staging.
- Secrets: no `env.example` or clear secret management section; document required secrets and where to store them (Railway/ Vercel / GitHub Secrets).

9) Tests & QA (P1)
- Tests exist under `tests/`. Validate which tests are integration vs unit and ensure they can run headlessly in CI (may require Supabase test instance or mocking). Key tests to validate: `webhook.test.js`, `test-message-storage.js`, `integration.test.js`, `server.test.js`.

10) Missing runbooks and handoff artifacts (P0)
- `README.md` and several docs exist but there is no single `handoff.md` or `amazon-q-checklist.md` that ties missions ↔ acceptance criteria ↔ env/PR naming. Create `mcp/amazon-q-missions.md` (done) and add this `inventory.md` to enable Amazon Q to open issues.

Suggested immediate next actions (Amazon Q)
1. Create issues for each P0 item: user-facing app, APIs for messaging, auth/RBAC seeds, message storage verification, and migration runner. Use labels `P0`, `infra`, `frontend`, `security`.
2. Add `env.example` listing required env vars and example values (non-sensitive placeholders).
3. Implement or decide between (A) Next.js `app/` per `frontend/routes_map.md`, or (B) an Express + static SPA approach. Document choice in a design note.
4. Enable n8n integration or replace with a queued job worker; implement idempotency + retry for webhook processing.
5. Add CI (`.github/workflows/ci.yml`) to run tests and lint on PRs.

Files referenced (quick links)
- `public/index.html`, `public/admin.html`, `public/manifest.json`
- `src/server.js`, `src/webhook.js`, `src/auth.js`, `src/media.js` (verify), `src/broadcast.js` (verify)
- `frontend/routes_map.md`, `supabase/` SQL files, `scripts/create_storage_bucket.js`, `scripts/seed_superadmin.sh`, `n8n/`, `n8n-local/docker-compose.yml`, `tests/`

If you want, I will now: (A) open GitHub issues (requires GH access), or (B) create local issue stubs as `issues/` markdown files and scaffold an `env.example`. Which should I do next? (I can also start scaffolding the Next.js `app/` pages if you prefer.)
