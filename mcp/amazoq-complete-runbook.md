**Amazon Q Runbook — Finish Implementation (100%)**

**Goal:** Deliver a safe, non-breaking, production-ready implementation that connects `moments` → `moment_intents` → n8n executor → WhatsApp, using the existing Supabase, MCP, and n8n components. No stubs, no mock secrets, progressive rollout, full verification and rollback instructions.

---

**Deliverables (what this runbook finishes):**
- Additive DB migration (`moment_intents`) and indexes — created.
- Test seed for `moments` — created.
- DB trigger to optionally create intents on insert — created.
- Supabase Edge function `handleMomentCreated` (Deno) — created and deployed.
- Admin API updated to invoke `handleMomentCreated` when requested (`use_edge: true`) or globally via env flag.
- n8n intent-executor workflow (importable JSON) — created.
- Verification queries, monitoring and rollback steps — documented here.

---

Prerequisites
- You have Supabase project access and service role key (already provisioned). Do NOT store the key in the repo.
- n8n instance accessible and able to store environment variables.
- WhatsApp Cloud API credentials provisioned in n8n as `WHATSAPP_TOKEN` and `PHONE_NUMBER_ID`.
- Supabase CLI or Dashboard access for applying migrations and deploying functions.

Environments / Variables (ensure these are set in the appropriate services):
- Supabase Functions / Edge: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE` (service role), `SUPABASE_SERVICE_ROLE_KEY` (where present). Do NOT commit keys.
- admin-api function env: `USE_EDGE_INTENT_CREATOR=true` (when ready to use Edge function), service role key present already.
- n8n env: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE`, `SUPABASE_ANON_KEY` or `SUPABASE_API_KEY`, `WHATSAPP_TOKEN`, `PHONE_NUMBER_ID`.

Files added in repo (reference):
- Schema migration: [supabase/migrations/20260110_create_moment_intents.sql](supabase/migrations/20260110_create_moment_intents.sql)
- Test seed: [supabase/migrations/20260110_test_sample_moments.sql](supabase/migrations/20260110_test_sample_moments.sql)
- Trigger: [supabase/migrations/20260111_moment_insert_trigger.sql](supabase/migrations/20260111_moment_insert_trigger.sql)
- Edge function: [supabase/functions/handleMomentCreated/index.ts](supabase/functions/handleMomentCreated/index.ts)
- Admin API changes: [supabase/functions/admin-api/index.ts](supabase/functions/admin-api/index.ts)
- n8n workflow: [n8n/intent-executor-workflow.json](n8n/intent-executor-workflow.json)
- MCP docs and pseudo-code: [mcp/emit_intents_pseudocode.md](mcp/emit_intents_pseudocode.md) and [mcp/README.md](mcp/README.md)

---

Recommended rollout plan (safe, progressive)
1. Sanity: run migration in a staging DB first, and import n8n workflow to a staging n8n with sandbox WhatsApp (if available).
2. Apply migrations (already added to repo). Use Supabase Dashboard SQL editor or `supabase db push`:
   - Apply `20260110_create_moment_intents.sql`
   - Apply `20260110_test_sample_moments.sql` (optional, for tests only)
   - Apply `20260111_moment_insert_trigger.sql` if you want DB-trigger behavior immediately.
3. Deploy Edge function `handleMomentCreated` (if not already):
   - `supabase functions deploy handleMomentCreated --project-ref <PROJECT_REF>`
   - Confirm the function URL in dashboard.
4. Set admin-api behavior for controlled switch:
   - Leave DB trigger enabled for now, OR
   - Prefer edge function: set `USE_EDGE_INTENT_CREATOR=true` in `admin-api` env and DROP the trigger later.
   - While testing, call admin-api with `use_edge: true` to invoke the Edge function without changing envs globally.
5. Import and configure n8n workflow:
   - Import `n8n/intent-executor-workflow.json` to your n8n instance.
   - Configure workflow credentials using env vars in n8n (no hard-coded secrets).
6. End-to-end test (manual):
   - Create a `moment` via `admin-api` with `use_edge: true` (or set env) and `publish_to_whatsapp=true` and `publish_to_pwa=true`.
   - Verify `moment_intents` rows appear (status `pending`).
   - Run n8n workflow manually to process the pending intent.
   - Verify `moment_intents` status updates to `sent` or `failed` and `send_logs` (if used) entries created.

---

Detailed commands & verification (copy-paste safe)

Apply migrations via Supabase SQL editor (paste file contents) or CLI:
```bash
# Using Supabase CLI (if configured):
supabase db push

# Or paste the SQL from repo files into Supabase SQL editor in this order:
# 1. supabase/migrations/20260110_create_moment_intents.sql
# 2. supabase/migrations/20260110_test_sample_moments.sql (optional)
# 3. supabase/migrations/20260111_moment_insert_trigger.sql (optional)
```

Verify `moment_intents` table exists and indexes:
```sql
SELECT table_name FROM information_schema.tables WHERE table_name = 'moment_intents';
SELECT * FROM moment_intents LIMIT 5;
```

Seed (test) moments (paste into SQL editor):
```sql
-- from supabase/migrations/20260110_test_sample_moments.sql
INSERT INTO moments (id, title, content, status, region, category, created_at)
VALUES ('11111111-1111-1111-1111-111111111111','Sample Community Update','Full rich content','draft','KZN','Education',now())
ON CONFLICT (id) DO NOTHING;
```

Test Edge function (curl from safe environment):
```bash
curl -X POST "<EDGE_FUNCTION_URL>" \
  -H "Content-Type: application/json" \
  -d '{"moment":{"id":"11111111-1111-1111-1111-111111111111","title":"Sample","content":"x","publish_to_whatsapp":false,"publish_to_pwa":true}}'
```

Verify intents created:
```sql
SELECT id, moment_id, channel, action, status, payload, created_at
FROM moment_intents
WHERE moment_id = '11111111-1111-1111-1111-111111111111';
```

Trigger n8n executor (manual):
- Import `n8n/intent-executor-workflow.json` if not already.
- Ensure env vars are set in n8n (see Environments list above).
- Run the workflow manually or wait for the cron to trigger.

Check that the intent status moves to `sent` and that delivery logs are captured (in `moment_intents.attempts` and `last_error`).

---

Acceptance criteria (what success looks like)
- `moment_intents` table is populated for admin-created moments when publish flags set.
- No duplicates for the same moment/channel (check counts grouped by `channel`).
- n8n executor can pick up `pending` intents and mark them `sent` or `failed` according to WhatsApp API responses.
- Production envs are not present in code; all credentials provisioned in dashboards or n8n.
- Admin workflow can create moments and trigger intents using `use_edge:true` before global rollout.

---

Monitoring and observability
- Use Supabase Functions logs for `handleMomentCreated` and `admin-api` to observe errors.
- n8n execution logs should show HTTP response codes from WhatsApp API and details of retries.
- Add simple Prometheus/Grafana or alerting based on failure rate in `moment_intents` (e.g., > 5% failed intents triggers alert).

Security notes
- Service role keys must remain secret. Rotate regularly.
- Limit who can call admin API endpoints via admin sessions. Keep session table secured.
- Use Supabase RLS where appropriate and ensure functions run with minimal required privileges when possible.

Rollback plan
1. If unintended intents are created, mark them `cancelled`:
```sql
UPDATE moment_intents SET status='cancelled', updated_at=now() WHERE created_at > now() - interval '10 minutes' AND status='pending';
```
2. Recreate or re-enable the trigger if previously removed.
3. Redeploy admin-api without the `use_edge` call if needed, or set `USE_EDGE_INTENT_CREATOR=false`.

---

Task checklist for Amazon Q agent (clear, actionable steps)
1. Confirm migrations applied in staging and prod.
2. Deploy Edge function and confirm envs.
3. Import n8n workflow and configure envs.
4. Test admin-api with `use_edge:true` and verify intents.
5. Run n8n executor to process pending intents (observe WhatsApp responses).
6. When satisfied, set `USE_EDGE_INTENT_CREATOR=true` in `admin-api` and `DROP TRIGGER` to avoid duplication (or vice versa — adopt trigger and disable edge).
7. Add monitoring/alerts for failed intents and delivery rates.
8. Document final state in project docs and close the task.

---

Contact / Ownership
- Implementation owner: repo maintainer / engineering lead.
- Operator: person with Supabase and n8n access.

---

If you want, I will now:
- produce a single combined SQL script that applies the migrations and removes the trigger (for the Edge-first rollout), or
- generate the `ops.md` with exact CLI/dashboard steps and checklists for an on-call operator.
