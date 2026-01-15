#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function applyMigration() {
  try {
    console.log('📄 Creating broadcast_batches table...');
    
    // Create the table directly
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
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
        
        CREATE INDEX IF NOT EXISTS idx_broadcast_batches_broadcast_id ON broadcast_batches(broadcast_id);
        CREATE INDEX IF NOT EXISTS idx_broadcast_batches_status ON broadcast_batches(status);
        
        ALTER TABLE broadcast_batches ENABLE ROW LEVEL SECURITY;
      `
    });
    
    if (error) {
      console.error('❌ Migration failed:', error);
    } else {
      console.log('✅ Migration applied successfully');
    }
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
  }
}

applyMigration();