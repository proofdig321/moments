-- Test helper: insert sample `moments` rows used by the guarded example inserts
-- Safe: uses INSERT ... ON CONFLICT DO NOTHING so it is additive and non-destructive.

-- Adjust columns as needed to match your `moments` schema. Minimal example follows.

INSERT INTO moments (id, title, content, status, region, category, created_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Sample Community Update', 'Full rich content for the PWA.', 'draft', 'KZN', 'Education', now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO moments (id, title, content, status, region, category, created_at)
VALUES
  ('22222222-2222-2222-2222-222222222222', 'Inbound Draft Example', 'Saved from inbound WhatsApp as draft.', 'draft', 'KZN', 'Education', now())
ON CONFLICT (id) DO NOTHING;

-- After running this, re-run the migration file (guarded inserts block) or run the guarded DO $$ block
-- to allow the example `moment_intents` rows to be inserted safely.
