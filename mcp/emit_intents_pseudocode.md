1) Purpose

This pseudo-code shows how MCP (Supabase Edge / decision engine) should decide channel intents and write them to `moment_intents`. MCP never sends messages — it only writes intents and returns intent IDs.

2) `handleMomentCreated(moment)` (JS/TS-style pseudocode)

```js
// Inputs: moment { id, title, content, region, publish_to_whatsapp, publish_to_pwa, ... }
// Outputs: array of created intent ids
async function handleMomentCreated(moment) {
  // idempotency: use an idempotency key (e.g., moments.id + "::intent") to avoid double-writing
  const idempotencyKey = `moment-intent:${moment.id}`;
  if (await alreadyProcessed(idempotencyKey)) return []; // idempotent

  // Call optimizer/decision logic (could be separate service)
  const decision = await mcpOptimizer(moment);
  // decision example: { whatsapp: true|false, pwa: true|false, template_id: 'marketing_v1' }

  const intents = [];
  if (decision.pwa || moment.publish_to_pwa) {
    const res = await db.query(`
      INSERT INTO moment_intents (moment_id, channel, action, status, payload)
      VALUES ($1, 'pwa', 'publish', 'pending', $2)
      RETURNING id`, [moment.id, JSON.stringify({title: moment.title})]);
    intents.push(res.rows[0].id);
  }
  if ((decision.whatsapp && moment.publish_to_whatsapp) || moment.publish_to_whatsapp) {
    const payload = {
      title: moment.title,
      summary: moment.summary || generateSummary(moment.content),
      link: `https://moments.example/m/${moment.id}`
    };
    const res = await db.query(`
      INSERT INTO moment_intents (moment_id, channel, action, status, template_id, payload)
      VALUES ($1, 'whatsapp', 'publish', 'pending', $2, $3)
      RETURNING id`, [moment.id, decision.template_id || null, JSON.stringify(payload)]);
    intents.push(res.rows[0].id);
  }

  await markProcessed(idempotencyKey);
  return intents;
}
```

Notes: `mcpOptimizer` is the decision function that inspects region rules, compliance flags, and moment metadata and returns recommended channels. MCP writes intents only.

3) `handleInboundMessage(message)`

```js
// Inputs: message { from, text, media, timestamp }
async function handleInboundMessage(message) {
  // 1. Detect command
  if (isCommand(message.text)) {
    return await handleCommand(message); // existing behavior preserved
  }

  // 2. For non-commands: save as draft moment (pending moderation)
  const draftMoment = await db.query(`
    INSERT INTO moments (id, content, author_source, status, region, created_at)
    VALUES ($1, $2, $3, 'pending_moderation', $4, now())
    RETURNING id`, [gen_random_uuid(), message.text, 'whatsapp_inbound', guessRegion(message)]);

  // 3. Create a non-publish intent to surface to admin (notify or internal)
  const intentRes = await db.query(`
    INSERT INTO moment_intents (moment_id, channel, action, status, payload)
    VALUES ($1, 'pwa', 'notify', 'pending', $2)
    RETURNING id`, [draftMoment.rows[0].id, JSON.stringify({source: 'inbound_whatsapp', raw: message})]);

  return { moment_id: draftMoment.rows[0].id, intent_id: intentRes.rows[0].id };
}
```

4) Idempotency & error handling

- Use idempotency keys derived from source + external message id to avoid duplicates.
- Wrap DB writes in transactions where appropriate.
- On DB failure: log and retry once with exponential backoff; do not call external messaging APIs.

5) Minimal SQL examples invoked by MCP

-- Insert intent (example)
INSERT INTO moment_intents (moment_id, channel, action, status, template_id, payload)
VALUES ($1, 'whatsapp', 'publish', 'pending', $2, $3)
RETURNING id;

-- Mark intent as cancelled (if admin revokes)
UPDATE moment_intents SET status='cancelled', updated_at=now() WHERE id=$1;

6) Summary

MCP responsibilities:
- Decide channel intents using rules and compliance checks
- Write `moment_intents` rows (pending)
- Return intent IDs and not call external channels

Executor responsibilities (n8n or worker):
- Poll `moment_intents` for pending intents and perform sends
- Update intent status to `sent`/`failed`
