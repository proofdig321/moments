-- Add broadcast batches table for parallel processing
CREATE TABLE IF NOT EXISTS broadcast_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID REFERENCES broadcasts(id) ON DELETE CASCADE,
  batch_number INTEGER NOT NULL,
  recipients TEXT[] NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_broadcast_batches_broadcast_id ON broadcast_batches(broadcast_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_batches_status ON broadcast_batches(status);

-- RLS policy
ALTER TABLE broadcast_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access" ON broadcast_batches FOR ALL USING (is_admin());