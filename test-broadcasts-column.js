#!/usr/bin/env node

/**
 * Test if authority_context column exists in broadcasts table
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

console.log('🔧 Testing broadcasts table structure...');

try {
  // Try to insert a test record with authority_context
  const testRecord = {
    moment_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
    recipient_count: 0,
    status: 'test',
    authority_context: { test: true }
  };

  const { data, error } = await supabase
    .from('broadcasts')
    .insert(testRecord)
    .select();

  if (error) {
    if (error.message.includes('authority_context')) {
      console.log('❌ authority_context column does not exist');
      console.log('📝 Please run this SQL in Supabase SQL Editor:');
      console.log('');
      console.log('ALTER TABLE broadcasts ADD COLUMN authority_context JSONB DEFAULT NULL;');
      console.log('CREATE INDEX IF NOT EXISTS idx_broadcasts_authority_context ON broadcasts USING GIN (authority_context);');
      console.log('');
    } else {
      console.log('⚠️ Other error (expected for dummy data):', error.message);
      console.log('✅ authority_context column likely exists');
    }
  } else {
    console.log('✅ authority_context column exists and working');
    // Clean up test record
    if (data && data[0]) {
      await supabase.from('broadcasts').delete().eq('id', data[0].id);
    }
  }

} catch (error) {
  console.error('❌ Test error:', error.message);
}