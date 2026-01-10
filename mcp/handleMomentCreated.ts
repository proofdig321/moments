// Supabase Edge function: handleMomentCreated
// - No hard-coded credentials. Uses env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE
// - Accepts POST JSON: { moment: { id, title, summary, link, publish_to_whatsapp, publish_to_pwa, template_id, region } }
// - Idempotent: if intents already exist for the moment+channel it returns existing intent ids.
// - Writes to `moment_intents` via Supabase REST API and returns created intent rows.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || Deno.env.get('NEXT_PUBLIC_SUPABASE_URL');
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE');

if (!SUPABASE_URL || !SERVICE_ROLE) {
  // Do not throw at import time on some runtimes; but functions should fail fast when invoked.
}

async function supabaseGet(path) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    method: 'GET',
    headers: {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase GET ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

async function supabaseInsert(path, body) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase INSERT ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

export default async function handleMomentCreated(req) {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    const body = await req.json();
    const moment = body.moment;
    if (!moment || !moment.id) {
      return new Response(JSON.stringify({ error: 'missing moment.id' }), { status: 400 });
    }

    const momentId = moment.id;
    const createdIntents = [];

    // Helper: check for existing intents for that moment+channel
    async function existingIntentFor(channel) {
      const q = `/rest/v1/moment_intents?moment_id=eq.${momentId}&channel=eq.${channel}`;
      const rows = await supabaseGet(q);
      return Array.isArray(rows) && rows.length ? rows : null;
    }

    // Create an intent row
    async function createIntent(channel, payload = {}, template_id = null) {
      const body = {
        moment_id: momentId,
        channel: channel,
        action: 'publish',
        status: 'pending',
        template_id: template_id,
        payload: payload
      };
      const res = await supabaseInsert('/rest/v1/moment_intents', body);
      // Supabase returns an array of inserted rows
      if (Array.isArray(res) && res.length) return res[0];
      return null;
    }

    // PWA intent
    if (moment.publish_to_pwa || moment.publish_to_pwa === undefined) {
      const existing = await existingIntentFor('pwa');
      if (existing) {
        createdIntents.push(...existing.map(r => r.id));
      } else {
        const payload = { title: moment.title, full_text: moment.content, link: moment.link || null };
        const row = await createIntent('pwa', payload, null);
        if (row) createdIntents.push(row.id);
      }
    }

    // WhatsApp intent: only if explicitly allowed
    if (moment.publish_to_whatsapp) {
      const existing = await existingIntentFor('whatsapp');
      if (existing) {
        createdIntents.push(...existing.map(r => r.id));
      } else {
        const payload = { title: moment.title, summary: moment.summary || null, link: moment.link || null };
        const row = await createIntent('whatsapp', payload, moment.template_id || null);
        if (row) createdIntents.push(row.id);
      }
    }

    return new Response(JSON.stringify({ moment_id: momentId, intents: createdIntents }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

/*
Deployment notes:
- Deploy this file as a Supabase Edge Function (Deno) or adapt to your serverless runtime.
- Ensure environment variables `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE` are provisioned (service role key required for insert).
- This implementation intentionally avoids hard-coded values and sample data.
*/
