#!/usr/bin/env node

/**
 * Apply broadcasts authority_context migration
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

console.log('🔧 Applying broadcasts authority_context migration...');

try {
  // Add authority_context column to broadcasts table
  const { error: alterError } = await supabase.rpc('exec_sql', {
    sql: `
      ALTER TABLE broadcasts 
      ADD COLUMN IF NOT EXISTS authority_context JSONB DEFAULT NULL;
      
      CREATE INDEX IF NOT EXISTS idx_broadcasts_authority_context 
      ON broadcasts USING GIN (authority_context);
    `
  });

  if (alterError) {
    console.error('❌ Migration failed:', alterError.message);
    process.exit(1);
  }

  console.log('✅ Migration applied successfully');
  console.log('✅ authority_context column added to broadcasts table');
  console.log('✅ GIN index created for authority_context');

} catch (error) {
  console.error('❌ Migration error:', error.message);
  process.exit(1);
}