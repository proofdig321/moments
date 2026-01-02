# Runbook: Applying RBAC and Campaigns Migrations to Staging

WARNING: Do NOT apply these files to production without peer review and staging validation.

Files to review:
- `supabase/rbac.sql`
- `supabase/campaigns_review.sql`
- `mcp/amazoq-output/test_queries.sql`

Prerequisites
- Have `psql` or `supabase` CLI configured and a staging database URL.
- Ensure you have a Supabase service role key for migrations if needed.

Apply steps (staging)
1. Inspect files locally and run a lint/SQL syntax check.
2. Backup staging DB or take a snapshot.
3. Run campaigns schema first, then RBAC:

```bash
# using psql and PGURI staging
psql "$STAGING_DATABASE_URL" -f supabase/campaigns_review.sql
psql "$STAGING_DATABASE_URL" -f supabase/rbac.sql
```

4. Run `mcp/amazoq-output/test_queries.sql` as an admin and as a role-bound user to validate behavior.

Rollback
- If an immediate rollback is required, use staging snapshot restore, or run the commented DROP statements at the bottom of each SQL file after manual review.

Validation checklist
- Confirm `admin_roles` contains expected entries.
- Confirm editors can insert campaigns but cannot publish.
- Confirm admins can publish and modify system_settings.
- Confirm public select behavior for `moments` and `campaigns` where status = 'published'.

Next steps
- After validation, create a PR with the SQL files and test results, request code review, then schedule a maintenance window to apply to production.
