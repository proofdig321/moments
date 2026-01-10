**handleMomentCreated Edge Function**

- Purpose: idempotently create `moment_intents` for newly created `moments`. The Edge function is production-ready and reads `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE` from environment variables. It does not contain any stubs or mock data.
- Location: `supabase/functions/handleMomentCreated/index.ts`

Inputs (POST JSON):
- { "moment": { "id": "uuid", "title": "...", "content": "...", "summary": "...", "link": "...", "publish_to_whatsapp": true|false, "publish_to_pwa": true|false, "template_id": "..." } }

Behavior:
- Checks existing `moment_intents` for the moment and channel to remain idempotent.
- Writes `moment_intents` rows via the Supabase REST API using the service role key.
- Returns created intent IDs in response.

Deployment & envs:
- Deploy using Supabase CLI or Dashboard. Ensure these env vars are set in Function settings:
  - `SUPABASE_URL` (e.g. https://<proj>.supabase.co)
  - `SUPABASE_SERVICE_ROLE` (service role key; keep secret)

Recommended flow:
1. Admin creates a `moment` in Admin UI. Admin may set `publish_to_pwa` and/or `publish_to_whatsapp`.
2. Either the DB trigger (supabase/migrations/20260111_moment_insert_trigger.sql) or a call to this Edge function will create `moment_intents` (both approaches are additive; choose one to avoid duplication).
3. n8n Intent Executor picks up pending `moment_intents` and sends messages, updating status.

Notes:
- Do not store secrets in code. The function expects env vars to be provisioned in the project.
- If you prefer the Edge function to be the canonical creator of intents (instead of the DB trigger), remove or disable the DB trigger migration and call this function from your admin API after moment insert. Both approaches are additive but avoid running both simultaneously to prevent duplicate intents.
