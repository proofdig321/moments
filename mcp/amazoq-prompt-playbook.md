You are an engineering agent with full knowledge of a Supabase-backed app that uses MCP (Supabase Edge functions) as a decision engine, n8n as an execution worker, and Meta/WhatsApp Cloud API for messaging. Constraints: make only additive, non-breaking changes; no dependency downgrades; default WhatsApp publishing must be opt-in; preserve existing command flows and Admin→PWA behavior. Produce three deliverables in the order below.

1) Supabase migration SQL for a new `moment_intents` table and minimal supporting indexes and examples of safe, additive migrations to add publish flags to `moments`. Requirements:
- Add a `moment_intents` table with columns: `id` (uuid PK), `moment_id` (uuid FK), `channel` (enum: 'whatsapp','pwa'), `action` (enum: 'publish','archive','notify'), `status` (enum: 'pending','sent','failed','cancelled'), `template_id` (nullable text), `payload` (jsonb), `attempts` (int default 0), `last_error` (text), `created_at` (timestamptz), `updated_at` (timestamptz).
- Provide safe SQL `CREATE TABLE` and an `ALTER TABLE` example to add `publish_to_whatsapp` and `publish_to_pwa` boolean columns on `moments` with default false for WhatsApp.
- Include FK constraints, sensible indexes (e.g., on `status`, `created_at`, `channel`), and a backwards-safe rollback `DROP TABLE`/`ALTER TABLE` snippet.
- Provide 1–2 example `INSERT` rows for a published admin moment intent and for a draft inbound-whatsapp saved-as-draft intent.

2) MCP pseudo-code that, given a moment creation or incoming webhook, makes decisions and writes intents (does not send messages). Requirements:
- Show a clear function (JS/TS or pseudocode) `handleMomentCreated(moment)` that calls the optimizer, decides channels, writes `moment_intents` rows, and returns intent IDs.
- Show `handleInboundMessage(message)` that detects commands (call existing command handler) vs content: for non-commands, save a `moment` draft with `status='pending_moderation'` and a non-publish intent; do NOT auto-publish.
- Include inputs/outputs, error handling, idempotency keys, and brief SQL examples for inserts/updates.
- Keep code minimal and readable; emphasize that MCP writes intents and does not call external APIs.

3) n8n workflow mapping (node-by-node) to execute intents and robustly send to WhatsApp. Requirements:
- Provide node list and order (trigger, fetch pending intents, fetch subscribers, render template, send message via HTTP Request to Meta API, update intent status, log).
- For each node list: purpose, input fields, example node settings (HTTP method, URL path variable), and key expressions to use when rendering `payload` or selecting `template_id`.
- Error handling: retries (exponential backoff), mark intent `failed` after N attempts, record `last_error`, backoff queue node, rate limiting considerations, and idempotency handling (use intent `id`).
- Example template mapping: short WhatsApp message format, personalization variables, and link to PWA.
- Provide a compact JSON snippet showing how to update intent status via Supabase REST/API after send success/failure.

Acceptance criteria:
- All outputs are additive SQL/code/flow files; no removal of existing DB fields or changes to existing endpoints' signatures.
- Defaults: `publish_to_whatsapp` = false; intents are created but not sent unless `publish_to_whatsapp` true.
- Provide brief verification steps to run locally: example SQL apply, test MCP call (curl), and a simulated n8n HTTP call.

Output format: return three clearly separated sections titled "1) Supabase migration", "2) MCP pseudo-code", "3) n8n workflow mapping". Keep each section copy-paste ready.

If you want, the assistant can now:
- generate the exact migration SQL file,
- implement the MCP pseudo-code in `mcp/` as a draft file,
- or create a node-by-node n8n JSON stub in `n8n/` to import.

Which deliverable should I produce first?
