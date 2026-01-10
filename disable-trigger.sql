-- Replace the problematic trigger function with a no-op version
CREATE OR REPLACE FUNCTION create_moment_intents_after_insert()
RETURNS trigger AS $$
BEGIN
  -- Do nothing - intents will be created by admin API instead
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;