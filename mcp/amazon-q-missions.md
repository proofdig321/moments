# Mission Brief: Amazon Q — Complete Missing Tasks

Repository: prooftv/whatsapp (branch: `main`)

Context: only the admin dashboard has been confirmed complete. The project needs a prioritized set of missions to finish user-facing pages, stabilize core infra, ensure deployability, and reach production readiness.

Goal: Deliver discrete, testable missions (code + tests + docs) so Amazon Q can take ownership and complete the project end-to-end.

Instructions for Amazon Q
- Start with Mission 1 (audit & inventory). Create an `inventory.md` in the repo root listing every missing page, API, and infra gap with exact file references.
- For each mission: open an issue, implement as a branch `amazoq/<mission-short>`, open PRs with clear changelogs, and attach test evidence.
- Report progress with short PR-friendly updates: summary, remaining work, blockers, and ETA.

Missions (prioritized)

M01 — Audit & Missing-Pages Inventory (Priority: P0)
- Deliverables: `inventory.md`, GitHub issues for each missing page/infra gap.
- Acceptance: Inventory maps to files and tests; issues created for every gap.
- Files to inspect: `public/`, `frontend/`, `src/`, `supabase/`, `mcp/`.
- Est: 1-2 days.

M02 — Frontend: User App Pages (Priority: P0)
- Deliverables: working pages & routes for: landing (`index.html`), onboarding, login/signup flow, conversation list, messaging UI, settings, moments feed.
- Acceptance: Pages reachable from nav, responsive, pass smoke tests, PWA meta in place.
- Files to update: `public/`, `frontend/`, `src/` (routes), `public/manifest.json`.
- Est: 5-10 days.

M03 — Auth & RBAC (Priority: P0)
- Deliverables: finalize Supabase auth flows, role seed scripts, RBAC policies, and update `RBAC_SETUP.md`.
- Acceptance: Role-based pages protected, `tests/auth-campaign.test.js` passes, seed script runs.
- Files: `supabase/rbac.sql`, `scripts/seed_superadmin.sh`, `src/auth.js`, `config/supabase.js`.
- Est: 2-4 days.

M04 — Webhooks & Retry Workflows (Priority: P1)
- Deliverables: robust webhook handlers (idempotency, dedupe), n8n workflows wired for retries, and an integration test simulating webhook retry scenarios.
- Acceptance: `tests/webhook.test.js` or equivalent passes; n8n flows validated locally.
- Files: `src/webhook.js`, `n8n/`, `n8n-local/docker-compose.yml`.
- Est: 2-3 days.

M05 — Message Storage + Media (Priority: P0)
- Deliverables: storage bucket creation script, reliable media upload/download, message persistence schema updates, migration scripts.
- Acceptance: create/upload/download roundtrip verified; `test-message-storage.js` passes.
- Files: `scripts/create_storage_bucket.js`, `src/media.js`, `supabase/*.sql`.
- Est: 3-5 days.

M06 — CI/CD & Deployment Playbooks (Priority: P1)
- Deliverables: GitHub Actions or equivalent to run tests/lint, verified `deploy-staging.sh`, `deploy-vercel.sh`, Railway setup doc, safe env examples.
- Acceptance: CI executes on PRs; at least one successful staging deploy documented.
- Files: `.github/workflows/` (add), `deploy-*`, `railway/`, `mcp-railway/`.
- Est: 2-4 days.

M07 — PWA & Offline Support (Priority: P2)
- Deliverables: solid service worker config, caching rules for API/media, offline fallbacks, manifest tuned.
- Acceptance: basic Lighthouse PWA checks pass; offline page works.
- Files: `public/manifest.json`, `sw.js`, `public/*.html`, `public/js/*`.
- Est: 1-3 days.

M08 — Integration Tests & QA (Priority: P1)
- Deliverables: extend `tests/` coverage for critical flows, make tests run in CI, add smoke tests and flakiness guard rails.
- Acceptance: integration tests pass in CI for main flows.
- Files: `tests/`, `test-*.sh` scripts.
- Est: 3-6 days.

M09 — Monitoring, Logging, Secrets (Priority: P2)
- Deliverables: integrate error monitoring (Sentry or alternative), structured logging improvements, document secret injection for each environment.
- Acceptance: errors captured in a test Sentry project; docs updated.
- Files: `config/*`, `DEPLOYMENT.md`, `VERCEL_ENV.md`.
- Est: 1-2 days.

M10 — Docs & Handoff (Priority: P0)
- Deliverables: update `README.md`, `DEPLOYMENT.md`, add developer onboarding, contribution guide, and handoff checklist.
- Acceptance: reviewer can run the app locally following docs.
- Files: `README.md`, `DEPLOYMENT.md`, `NEXT_STEPS.md`.
- Est: 1-2 days.

Operational rules and acceptance criteria
- Each mission must include: issue, branch `amazoq/<short>`, PR with description, tests or QA steps, and a clear acceptance checklist.
- Use semantic commit messages: `amazoq(<mission>): short summary`.
- When a mission touches infra or secrets, include `DEPLOYMENT.md` updates and a runbook for rollback.

Deliverable: single PR per mission (or small set of PRs) that contains code, tests, and docs. For multi-part missions open a meta-issue that tracks sub-tasks.

Initial Amazon Q Prompt (use this at start)
"You are Amazon Q, an experienced full-stack engineer. Repo: prooftv/whatsapp on `main`. Only admin dashboard is confirmed complete. Start with M01: run a full audit and produce `inventory.md` listing missing pages, missing backend APIs, schema/migration gaps, infra gaps (storage, webhooks, CI), and a prioritized issue for each. Use automated tests where possible. After M01, proceed mission-by-mission in priority order; open issues and branches named `amazoq/<mission-short>`. Report progress on each PR. When blocked, leave clear reproduction steps and requested access."

---

If you want, I can open the initial `inventory.md` and populate it with a first-pass list (scanning file structure). Shall I proceed to generate that file now?
