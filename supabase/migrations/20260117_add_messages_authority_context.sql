-- Add authority_context column to messages table
-- Phase 1.2: Extend existing messages table for authority integration
-- Date: January 17, 2026
-- Status: ADDITIVE ONLY - Zero production impact

-- Add authority_context column to store authority metadata
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS authority_context JSONB DEFAULT NULL;

-- Add index for authority context queries (optional, for performance)
CREATE INDEX IF NOT EXISTS idx_messages_authority_context 
ON messages USING GIN (authority_context) 
WHERE authority_context IS NOT NULL;

-- Verify the column was added
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'messages' AND column_name = 'authority_context';