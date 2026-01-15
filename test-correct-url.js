#!/usr/bin/env node

import { config } from 'dotenv';

config();

async function testCorrectURL() {
  try {
    console.log('🧪 Testing broadcast function with correct URL...');
    
    // Use the actual deployed URL
    const webhookUrl = `${process.env.SUPABASE_URL}/functions/v1/rapid`;
    
    console.log('📡 Testing URL:', webhookUrl);
    
    // Test CORS first
    const corsResponse = await fetch(webhookUrl, {
      method: 'OPTIONS',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`
      }
    });
    
    console.log('📨 CORS response:', corsResponse.status);
    
    if (corsResponse.status === 200) {
      console.log('✅ Function is responding!');
      
      // Test with small payload (should use sequential processing)
      const testPayload = {
        broadcast_id: 'test-' + Date.now(),
        message: 'Test batch processing system',
        recipients: ['+27123456789', '+27987654321'], // 2 recipients - sequential
        moment_id: null
      };
      
      console.log('📱 Testing with 2 recipients (sequential processing)...');
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testPayload)
      });
      
      const result = await response.text();
      console.log('📨 Response status:', response.status);
      console.log('📄 Response:', result.substring(0, 500));
      
      if (response.ok) {
        console.log('✅ Batch processing system is LIVE!');
        
        // Test with large payload (should use batch processing)
        const largeBatch = [];
        for (let i = 0; i < 75; i++) {
          largeBatch.push(`+27${String(i).padStart(9, '0')}`);
        }
        
        const batchPayload = {
          broadcast_id: 'batch-test-' + Date.now(),
          message: 'Large batch test - should trigger batch processing',
          recipients: largeBatch, // 75 recipients - should trigger batching
          moment_id: null
        };
        
        console.log('📦 Testing with 75 recipients (batch processing)...');
        
        const batchResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(batchPayload)
        });
        
        const batchResult = await batchResponse.text();
        console.log('📦 Batch response status:', batchResponse.status);
        console.log('📄 Batch response:', batchResult.substring(0, 500));
        
        if (batchResult.includes('batches_created')) {
          console.log('🎉 BATCH PROCESSING IS WORKING!');
        }
        
      } else {
        console.log('❌ Function error');
      }
      
    } else {
      console.log('❌ Function not responding correctly');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testCorrectURL();