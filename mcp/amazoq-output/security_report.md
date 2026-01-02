# Security Audit Report (auto-generated checklist)

Summary
-------
This checklist highlights security gaps found in the codebase and recommended fixes prioritized by severity.

Critical
- Webhook endpoints lack enforced HMAC validation in all paths — implement `WEBHOOK_HMAC_SECRET` verification on `POST /webhook` and require `X-Internal-Secret` for internal retries.
- Service role keys may be exposed in n8n/workflows — rotate keys and store in secure environment variables/secrets manager.

High
- RLS is enabled in `safe-migration.sql` but uses `is_admin()` returning `true` (demo). Replace with role table checks (`admin_roles`) and conservative policies before enabling in production.
- No Content Security Policy (CSP) headers configured in responses — add CSP via `helmet` or manual headers.

Medium
- Rate limiting implemented in-memory (server.js) — recommend Redis or external store for distributed rate limiting.
- CSRF double-submit cookie exists but ensure all state-changing POST/PUT/DELETE endpoints validate it.

Low
- Service worker caches may accidentally cache API responses — ensure fetch handlers skip `api/` and `/_admin` paths.
- Add dependency vulnerability scanning in CI (e.g., `npm audit --audit-level=moderate` and `dependabot`).

Remediations
- Replace demo `is_admin()` with `admin_roles` lookup; use `supabase/rbac.sql` and test in staging.
- Add HMAC verification middleware using `crypto.createHmac('sha256', WEBHOOK_HMAC_SECRET)`. Verify raw body handling.
- Use `helmet()` with an explicit CSP string; review third-party scripts before allowing `unsafe-inline`.
- Move rate limiter to Redis-backed store (e.g., `rate-limiter-flexible` with Redis). Configure limits per IP and per authenticated user.
- Add GitHub Actions job to run `npm audit` and schedule Dependabot PRs.

Deliverables included
- `supabase/rbac.sql` — recommended RBAC SQL (idempotent)
- `supabase/campaigns_review.sql` — campaigns schema additions
- `mcp/amazoq-output/test_queries.sql` — validation queries
