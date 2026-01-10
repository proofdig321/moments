-- 2026-01-11: trigger to create moment_intents on moments insert when publish flags set
-- Additive, non-breaking: only inserts intents when publish flags are true, and checks for existing intents.

CREATE OR REPLACE FUNCTION create_moment_intents_after_insert()
RETURNS trigger AS $$
BEGIN
  -- Only act when row is newly inserted
  -- PWA intent
  IF (NEW.publish_to_pwa IS TRUE) THEN
    IF NOT EXISTS (
      SELECT 1 FROM moment_intents mi WHERE mi.moment_id = NEW.id AND mi.channel = 'pwa'
    ) THEN
      INSERT INTO moment_intents (moment_id, channel, action, status, payload)
      VALUES (
        NEW.id,
        'pwa',
        'publish',
        'pending',
        jsonb_build_object('title', NEW.title, 'full_text', NEW.content, 'link', COALESCE(NEW.pwa_link, NULL))
      );
    END IF;
  END IF;

  -- WhatsApp intent (only when explicitly opted in)
  IF (NEW.publish_to_whatsapp IS TRUE) THEN
    IF NOT EXISTS (
      SELECT 1 FROM moment_intents mi WHERE mi.moment_id = NEW.id AND mi.channel = 'whatsapp'
    ) THEN
      INSERT INTO moment_intents (moment_id, channel, action, status, template_id, payload)
      VALUES (
        NEW.id,
        'whatsapp',
        'publish',
        'pending',
        COALESCE(NEW.template_id, NULL),
        jsonb_build_object('title', NEW.title, 'summary', COALESCE(NEW.summary, NULL), 'link', COALESCE(NEW.pwa_link, NULL))
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on moments table to run after insert
DROP TRIGGER IF EXISTS trg_create_moment_intents ON moments;
CREATE TRIGGER trg_create_moment_intents
AFTER INSERT ON moments
FOR EACH ROW EXECUTE FUNCTION create_moment_intents_after_insert();

-- Rollback notes (if needed):
-- DROP TRIGGER IF EXISTS trg_create_moment_intents ON moments;
-- DROP FUNCTION IF EXISTS create_moment_intents_after_insert();
