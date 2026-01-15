#!/usr/bin/env node

import { config } from 'dotenv';

config();

async function testBatchProcessing() {
  try {
    console.log('🧪 Testing batch processing with 75 recipients...');
    
    const webhookUrl = `${process.env.SUPABASE_URL}/functions/v1/broadcast-webhook`;
    
    // Create 75 test recipients (should trigger batching at >50)
    const recipients = [];
    for (let i = 0; i < 75; i++) {
      recipients.push(`+27${String(i).padStart(9, '0')}`);
    }
    
    const testPayload = {
      broadcast_id: 'batch-test-' + Date.now(),
      message: 'Testing batch processing system - this should create 2 batches (50 + 25)',
      recipients: recipients,
      moment_id: null
    };
    
    console.log('📦 Sending 75 recipients (should create 2 batches)...');
    console.log('⏱️ Expected: Batch processing with faster rate limiting');
    
    const startTime = Date.now();
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });
    
    const result = await response.text();
    const duration = Date.now() - startTime;
    
    console.log('📨 Response status:', response.status);
    console.log('⏱️ Total duration:', duration + 'ms');
    console.log('📄 Response:', result);
    
    if (response.ok) {
      const data = JSON.parse(result);
      
      if (data.batches_created) {
        console.log('🎉 BATCH PROCESSING IS WORKING!');
        console.log(`📦 Batches created: ${data.batches_created}`);
        console.log(`✅ Success: ${data.success_count}/${data.total_recipients}`);
        console.log(`❌ Failed: ${data.failure_count}/${data.total_recipients}`);
        
        // Calculate performance
        const messagesPerSecond = (data.success_count / (duration / 1000)).toFixed(2);
        console.log(`⚡ Performance: ${messagesPerSecond} messages/second`);
        
        if (data.batches_created === 2) {
          console.log('✅ Correct batch count: 2 batches (50 + 25)');
        }
        
      } else {
        console.log('⚠️ Sequential processing used (no batches created)');
        console.log(`✅ Success: ${data.success_count}/${data.total_recipients}`);
      }
      
    } else {
      console.log('❌ Batch test failed');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testBatchProcessing();