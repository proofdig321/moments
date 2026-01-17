#!/usr/bin/env node

/**
 * Apply broadcasts authority_context migration using direct queries
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
  // Check if column already exists
  const { data: columns, error: checkError } = await supabase
    .from('information_schema.columns')
    .select('column_name')
    .eq('table_name', 'broadcasts')
    .eq('column_name', 'authority_context');

  if (checkError) {
    console.error('❌ Column check failed:', checkError.message);
    process.exit(1);
  }

  if (columns && columns.length > 0) {
    console.log('✅ authority_context column already exists');
  } else {
    console.log('⚠️ authority_context column does not exist');
    console.log('📝 Please run this SQL in Supabase SQL Editor:');
    console.log('');
    console.log('ALTER TABLE broadcasts ADD COLUMN authority_context JSONB DEFAULT NULL;');
    console.log('CREATE INDEX IF NOT EXISTS idx_broadcasts_authority_context ON broadcasts USING GIN (authority_context);');
    console.log('');
    console.log('Then re-run the Phase 5 test.');
  }

} catch (error) {
  console.error('❌ Migration error:', error.message);
  process.exit(1);
}