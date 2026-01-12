# Issue: Finalize Auth & RBAC

Priority: P0

Summary:
Stabilize Supabase auth flows, seed admin roles, and ensure `requireRole` and `requireAuth` are tested and documented.

Acceptance criteria:
- `scripts/seed_superadmin.sh` runs in CI or documented local steps.
- `RBAC_SETUP.md` updated with exact SQL and seed steps.
- `tests/auth-campaign.test.js` and/or `tests/admin-ui.files.test.js` passing for role checks.
