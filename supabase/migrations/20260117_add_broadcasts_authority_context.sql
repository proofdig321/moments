-- Add authority context to broadcasts table for Phase 5: Broadcast Integration
-- This tracks which authority profile was used for each broadcast

-- Add authority_context column to broadcasts table
ALTER TABLE broadcasts 
ADD COLUMN authority_context JSONB DEFAULT NULL;

-- Add index for authority context queries
CREATE INDEX IF NOT EXISTS idx_broadcasts_authority_context 
ON broadcasts USING GIN (authority_context);

-- Add comment for documentation
COMMENT ON COLUMN broadcasts.authority_context IS 'Authority profile context used for broadcast filtering and audit trail';

-- Example authority_context structure:
-- {
--   "authority_id": "uuid",
--   "authority_level": 3,
--   "blast_radius": 500,
--   "scope": "region",
--   "original_subscriber_count": 1200
-- }