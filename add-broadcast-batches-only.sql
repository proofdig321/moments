-- Add broadcast_batches table only (minimal migration)
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

-- Add indexes for broadcast_batches
CREATE INDEX IF NOT EXISTS idx_broadcast_batches_broadcast_id ON broadcast_batches(broadcast_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_batches_status ON broadcast_batches(status);

-- Enable RLS and add policy only if table was created
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'broadcast_batches') THEN
    ALTER TABLE broadcast_batches ENABLE ROW LEVEL SECURITY;
    
    -- Only create policy if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'broadcast_batches' AND policyname = 'Admin full access') THEN
      CREATE POLICY "Admin full access" ON broadcast_batches FOR ALL USING (is_admin());
    END IF;
  END IF;
END $$;