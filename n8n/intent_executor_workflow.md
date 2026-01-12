n8n node-by-node mapping: Intent Executor (whatsapp)

Overview:
- Trigger: periodic schedule or Supabase webhook -> process pending `moment_intents` where channel='whatsapp' and status='pending'.
- Flow: fetch intents -> for each intent fetch subscribers -> render template -> send WhatsApp message -> update intent status -> logging and retry handling.

Nodes (ordered):

1) Trigger
- Purpose: start the flow on a schedule (e.g., every 30s) or via HTTP webhook from Supabase.
- Example: Cron or Webhook node.

2) Fetch Pending Intents (HTTP Request - Supabase REST)
- Purpose: GET pending intents
- Method: GET
- URL: `https://<SUPABASE_URL>/rest/v1/moment_intents?status=eq.pending&channel=eq.whatsapp&select=*` 
- Headers: `apikey`, `Authorization: Bearer <service_role_key>`
- Output: array of intent records

3) Split In Batches / For Each
- Purpose: iterate intents one-by-one or in controlled batches to respect rate limits.

4) Fetch Subscribers (HTTP Request / DB)
- Purpose: fetch subscribed users for the intent's moment region
- Example URL: `https://<SUPABASE_URL>/rest/v1/subscribers?region=eq.{{ $json["region"] }}`
- Note: apply pagination and batching

5) Render Template (Function or Set node)
- Purpose: create message body from `intent.payload` and `template_id`.
- Example template mapping:
  "📢 New Moment: {{title}}\n\n{{summary}}\n\nRead more: {{link}}"
- Personalisation variables: `subscriber.name`, `moment.title`, `link`.

6) Send Message (HTTP Request to Meta)
- Purpose: send the message via WhatsApp Cloud API
- Method: POST
- URL: `https://graph.facebook.com/v19.0/{{ $env.PHONE_NUMBER_ID }}/messages`
- Headers: `Authorization: Bearer {{$env.WHATSAPP_TOKEN}}`, `Content-Type: application/json`
- Body (JSON):
{
  "messaging_product": "whatsapp",
  "to": "{{subscriber.phone}}",
  "type": "template",
  "template": {
    "name": "{{ $json.template_id || 'marketing_v1' }}",
    "language": { "code": "en_US" },
    "components": [ /* personalize per template */ ]
  }
}
- Use intent `id` as idempotency key in message metadata (if supported) and in logs.

7) Update Intent Status (HTTP Request)
- Purpose: mark intent as `sent` or increment attempts and mark `failed` when appropriate
- On success: PATCH `https://<SUPABASE_URL>/rest/v1/moment_intents?id=eq.{{ $json.id }}` with body `{ "status": "sent", "updated_at": "now()" }`
- On failure: PATCH with `{ "status": "failed", "attempts": {{ $json.attempts + 1 }}, "last_error": "<error message>" }`
- Authentication: service_role_key

8) Error Handling / Retry
- Use a Retry node or custom backoff queue:
  - If attempts < MAX_RETRIES (e.g., 5) then re-queue with exponential backoff (2^attempts seconds)
  - After MAX_RETRIES mark `failed` and notify admin
- Rate limiting: pause between sends or use concurrency control in split node

9) Logging / Observability
- Write logs to a `send_logs` table or external logging service with intent_id, subscriber, status, response
- Optionally emit metrics to Prometheus or similar

Idempotency
- Use `intent.id` and subscriber phone to avoid double sends. Before send, check `send_logs` for existing successful row for (intent_id, subscriber)

Supabase update example (PATCH) after send success:

PATCH /rest/v1/moment_intents?id=eq.{intent_id}
Headers: Authorization: Bearer <service_role_key>
Body:
{
  "status": "sent",
  "updated_at": "now()"
}

Notes
- Keep `publish_to_whatsapp` false by default; only admin-published moments with that flag true should lead MCP to create whatsapp intents.
- For templates: keep short messages + link to PWA to avoid long marketing messages.
- Use n8n credentials securely (environment variables) and use Supabase service role for intent updates.

Optional: provide a JSON stub for import if you want an initial n8n workflow file; I can generate that next.