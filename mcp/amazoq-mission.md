# AmaZoq Agent Mission: RBAC, Campaigns, UI Mockups, and Safety Playbook

Mission objective
-----------------
Automate the safe generation and review of Supabase Row Level Security (RLS) policies and RBAC SQL, produce a reviewed `campaigns` schema upgrade, generate admin UI mockups and assets, run a static security audit checklist, and bundle everything as a migration-ready package for manual application to staging.

High-level deliverables
-----------------------
- `supabase/rbac.sql` — Recommended RLS policies and `admin_roles` table with clear comments and rollback SQL.
- `supabase/campaigns_review.sql` — Additions/alterations to the `campaigns` feature, idempotent and safe-to-apply.
- `mcp/amazoq-output/` — ZIP containing: SQL files, a short runbook, test queries to validate policies, and a diff summary.
- Admin UI mockups — a small set of HTML/CSS/JS snippets (screenshot-ready) demonstrating sponsor/campaign approval flows, swipe card UX, and role management components.
- Security audit report — checklist with findings and recommended fixes (CSP, webhook HMAC, rate limiting, secret handling, supply-chain checks).

Constraints & safety rules
-------------------------
- Do NOT apply any SQL to production. Produce SQL files only and include explicit `-- REVIEW BEFORE APPLYING` warnings at the top.
- Prefer idempotent statements: `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... IF NOT EXISTS` patterns, and `CREATE POLICY IF NOT EXISTS` style via guard blocks.
- Keep `is_admin()` logic explicit and conservative; prefer role checks against `admin_roles` table instead of a global `is_admin()` that returns true.
- Provide a rollback SQL file for every change.
- Provide a small test plan with SQL queries that verify behavior as different Supabase users (anon, service_role, role-bound user). Include expected results.

Acceptance criteria
-------------------
- RLS SQL is readable, commented, and includes safe guards and rollback.
- Campaign schema changes are idempotent and include sensible constraints and indexes.
- Mockups are accessible, mobile-first, and demonstrate the key admin flows (create, approve, publish, sponsor preview).
- Security audit lists concrete actionable items prioritized by severity.
- Deliverables are placed in `mcp/amazoq-output/` and referenced in this mission file.

Agent tasks (step-by-step)
-------------------------
1. Inspect `supabase/safe-migration.sql` and existing `supabase/` files to avoid duplicate objects.
2. Create `supabase/rbac.sql` implementing `admin_roles` (user_id, role), define roles: `superadmin`, `admin`, `editor`, `viewer`, and write RLS policies for `moments`, `broadcasts`, `sponsors`, `system_settings`, and `campaigns` to enforce role-based access.
3. Create `supabase/campaigns_review.sql` with safe `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE` statements; include indexes and constraints for scheduled broadcasts, segmentation, and sponsor linkage.
4. Produce a `runbook.md` explaining how to apply migrations to a staging Supabase project, test steps, and how to rollback.
5. Generate simple HTML/CSS/JS admin UI snippets (no production bundling) demonstrating the approval workflow and swipe cards, save under `mcp/amazoq-output/ui/`.
6. Run a static checklist: check for raw-secret exposure, missing HMAC on webhooks, CSP header gaps, and provide prioritized remediation.
7. Produce test SQL queries that demonstrate enforcement of policies when run as different roles.

Notes for reviewers
------------------
- The agent should err on the side of caution — produce safe SQL and clear manual steps for operators.
- Include comments that explain the security rationale for each policy.
- If a recommended policy would break existing admin flows, include a detection snippet to locate conflicting rows and a mitigation plan.

Deliverable locations
---------------------
- `supabase/rbac.sql` — proposed RLS and admin_roles table.
- `supabase/campaigns_review.sql` — campaign schema changes.
- `mcp/amazoq-output/` — all generated artifacts, runbook, UI snippets, test SQL, and security report.

Contact / context
-----------------
Repository: prooftv/whatsapp (branch: main)
Primary contacts: repo owner (use PR comments) — do not auto-merge.

---
-- REVIEW BEFORE APPLYING: All SQL here is advisory and must be peer-reviewed on staging before production migration.
