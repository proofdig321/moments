#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testBatchTable() {
  try {
    console.log('🔍 Testing broadcast_batches table...');
    
    // Test if we can query the table
    const { data, error } = await supabase
      .from('broadcast_batches')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Table query failed:', error);
      return;
    }
    
    console.log('✅ broadcast_batches table exists and is queryable');
    
    // Test if we can insert a record
    const testBatch = {
      broadcast_id: 'test-broadcast-' + Date.now(),
      batch_number: 1,
      recipients: ['+27123456789'],
      status: 'pending'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('broadcast_batches')
      .insert(testBatch)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Insert failed:', insertError);
      return;
    }
    
    console.log('✅ Can insert into broadcast_batches table');
    console.log('📄 Inserted record:', insertData);
    
    // Clean up
    await supabase
      .from('broadcast_batches')
      .delete()
      .eq('id', insertData.id);
    
    console.log('🧹 Cleaned up test record');
    console.log('🎉 broadcast_batches table is fully functional!');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testBatchTable();