-- Fix the trigger to not reference non-existent fields
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
        'marketing_v1',  -- Default template instead of referencing non-existent field
        jsonb_build_object(
          'title', NEW.title, 
          'summary', LEFT(NEW.content, 100) || '...', -- Generate summary from content
          'link', COALESCE(NEW.pwa_link, 'https://moments.unamifoundation.org/m/' || NEW.id)
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;