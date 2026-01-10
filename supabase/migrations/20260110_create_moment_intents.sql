-- 2026-01-10: create moment_intents table (additive, backwards-safe)

-- Ensure UUID generation function exists
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'intent_channel') THEN
            CREATE TYPE intent_channel AS ENUM ('whatsapp','pwa');
                END IF;
                    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'intent_action') THEN
                            CREATE TYPE intent_action AS ENUM ('publish','archive','notify');
                                END IF;
                                    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'intent_status') THEN
                                            CREATE TYPE intent_status AS ENUM ('pending','sent','failed','cancelled');
                                                END IF;
                                                END $$;

                                                -- Create table
                                                CREATE TABLE IF NOT EXISTS moment_intents (
                                                  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                                                    moment_id uuid NOT NULL,
                                                      channel intent_channel NOT NULL,
                                                        action intent_action NOT NULL DEFAULT 'publish',
                                                          status intent_status NOT NULL DEFAULT 'pending',
                                                            template_id text NULL,
                                                              payload jsonb NULL,
                                                                attempts int NOT NULL DEFAULT 0,
                                                                  last_error text NULL,
                                                                    created_at timestamptz NOT NULL DEFAULT now(),
                                                                      updated_at timestamptz NOT NULL DEFAULT now(),
                                                                        CONSTRAINT fk_moment
                                                                            FOREIGN KEY(moment_id) REFERENCES moments(id) ON DELETE CASCADE
                                                                            );

                                                                            -- Indexes for efficient polling
                                                                            CREATE INDEX IF NOT EXISTS idx_moment_intents_status_channel ON moment_intents (status, channel);
                                                                            CREATE INDEX IF NOT EXISTS idx_moment_intents_created_at ON moment_intents (created_at);
                                                                            CREATE INDEX IF NOT EXISTS idx_moment_intents_moment_id ON moment_intents (moment_id);

                                                                            -- Trigger to keep updated_at fresh
                                                                            CREATE OR REPLACE FUNCTION moment_intents_updated_at() RETURNS trigger AS $$
                                                                            BEGIN
                                                                              NEW.updated_at = now();
                                                                                RETURN NEW;
                                                                                END;
                                                                                $$ LANGUAGE plpgsql;

                                                                                DROP TRIGGER IF EXISTS trg_moment_intents_updated_at ON moment_intents;
                                                                                CREATE TRIGGER trg_moment_intents_updated_at
                                                                                BEFORE UPDATE ON moment_intents
                                                                                FOR EACH ROW EXECUTE FUNCTION moment_intents_updated_at();

                                                                                -- Safe, additive ALTER to add publish flags to moments
                                                                                ALTER TABLE IF EXISTS moments
                                                                                  ADD COLUMN IF NOT EXISTS publish_to_whatsapp boolean NOT NULL DEFAULT false,
                                                                                    ADD COLUMN IF NOT EXISTS publish_to_pwa boolean NOT NULL DEFAULT true;

                                                                                    -- Example inserts
                                                                                    -- Admin-created moment which should generate a WhatsApp + PWA intent (example)
                                                                                    -- Example inserts (guarded): only run these if referenced `moments` rows already exist.
                                                                                    -- These are provided as examples; avoid running these in environments where the
                                                                                    -- example `moments` rows do not exist to prevent foreign key violations.

                                                                                    DO $$
                                                                                    BEGIN
                                                                                      IF EXISTS (SELECT 1 FROM moments WHERE id = '11111111-1111-1111-1111-111111111111') THEN
                                                                                        INSERT INTO moment_intents (moment_id, channel, action, status, template_id, payload)
                                                                                        VALUES
                                                                                          ('11111111-1111-1111-1111-111111111111', 'whatsapp', 'publish', 'pending', 'marketing_v1',
                                                                                           '{"title":"Community Update","summary":"Short summary for WhatsApp","link":"https://moments.example/m/11111111"}'),
                                                                                          ('11111111-1111-1111-1111-111111111111', 'pwa', 'publish', 'pending', NULL,
                                                                                           '{"full_text":"Full rich content for the PWA.","media":null}');
                                                                                      END IF;

                                                                                      IF EXISTS (SELECT 1 FROM moments WHERE id = '22222222-2222-2222-2222-222222222222') THEN
                                                                                        INSERT INTO moment_intents (moment_id, channel, action, status, payload)
                                                                                        VALUES
                                                                                          ('22222222-2222-2222-2222-222222222222', 'pwa', 'notify', 'pending', '{"source":"inbound_whatsapp","note":"saved_as_draft"}');
                                                                                      END IF;
                                                                                    END $$;

                                                                                                -- Rollback snippets (for reference)
                                                                                                -- DROP TABLE IF EXISTS moment_intents;
                                                                                                -- ALTER TABLE moments DROP COLUMN IF EXISTS publish_to_whatsapp;
                                                                                                -- ALTER TABLE moments DROP COLUMN IF EXISTS publish_to_pwa;
                                                                                                -- DROP TYPE IF EXISTS intent_channel, intent_action, intent_status;

                                                                                                -- End of migration
                                                                                                