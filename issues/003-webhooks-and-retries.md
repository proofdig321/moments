# Issue: Webhook reliability, idempotency, and retries

Priority: P1

Summary:
Harden `src/webhook.js` processing: verify idempotency, add retry-safe job dispatch, enable n8n or replace with queued worker, and ensure HMAC verification is robust.

Acceptance criteria:
- `triggerN8nWorkflow` is implemented or an alternative queue is provided.
- Incoming webhook verification and HMAC behavior documented in `DEPLOYMENT.md` with required env vars.
- Integration test simulating retries and duplicate delivery passes.
