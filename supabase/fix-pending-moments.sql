-- Add sent_at timestamp column to pending_moments
ALTER TABLE pending_moments ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;

-- Verify the fix
SELECT * FROM pending_moments WHERE sent = true ORDER BY sent_at DESC LIMIT 10;
