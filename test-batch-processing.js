#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testBatchProcessing() {
  try {
    console.log('🧪 Testing batch processing logic...');
    
    // Create a test broadcast
    const { data: broadcast, error: broadcastError } = await supabase
      .from('broadcasts')
      .insert({
        recipient_count: 150, // This should trigger batching (>50)
        status: 'pending'
      })
      .select()
      .single();
    
    if (broadcastError) {
      console.error('❌ Failed to create test broadcast:', broadcastError);
      return;
    }
    
    console.log('✅ Created test broadcast:', broadcast.id);
    
    // Test the broadcast webhook with a large recipient list
    const testRecipients = [];
    for (let i = 0; i < 150; i++) {
      testRecipients.push(`+27${String(i).padStart(9, '0')}`);
    }
    
    const webhookUrl = `${process.env.SUPABASE_URL}/functions/v1/broadcast-webhook`;
    const payload = {
      broadcast_id: broadcast.id,
      message: 'Test batch processing message',
      recipients: testRecipients,
      moment_id: null
    };
    
    console.log('📡 Calling broadcast webhook with 150 recipients...');
    console.log('🔄 This should create 3 batches (50 recipients each)');
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const result = await response.text();
    console.log('📨 Webhook response:', response.status);
    console.log('📄 Response body:', result.substring(0, 500));
    
    // Check if batches were created
    const { data: batches } = await supabase
      .from('broadcast_batches')
      .select('*')
      .eq('broadcast_id', broadcast.id);
    
    console.log(`📦 Batches created: ${batches?.length || 0}`);
    if (batches && batches.length > 0) {
      console.log('✅ Batch processing is working!');
      batches.forEach(batch => {
        console.log(`   - Batch ${batch.batch_number}: ${batch.recipients.length} recipients, status: ${batch.status}`);
      });
    }
    
    // Cleanup
    await supabase.from('broadcast_batches').delete().eq('broadcast_id', broadcast.id);
    await supabase.from('broadcasts').delete().eq('id', broadcast.id);
    console.log('🧹 Cleaned up test data');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testBatchProcessing();