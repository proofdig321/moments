#!/usr/bin/env node

import { config } from 'dotenv';

config();

async function testWithProperUUID() {
  try {
    console.log('🧪 Testing batch processing with proper UUID...');
    
    const webhookUrl = `${process.env.SUPABASE_URL}/functions/v1/broadcast-webhook`;
    
    // First create a proper broadcast record to get a real UUID
    const createBroadcastUrl = `${process.env.SUPABASE_URL}/rest/v1/broadcasts`;
    
    const broadcastResponse = await fetch(createBroadcastUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_KEY,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        recipient_count: 75,
        status: 'pending'
      })
    });
    
    const broadcastData = await broadcastResponse.json();
    
    if (!broadcastResponse.ok || !broadcastData[0]) {
      console.error('❌ Failed to create broadcast record:', broadcastData);
      return;
    }
    
    const broadcastId = broadcastData[0].id;
    console.log('✅ Created broadcast record with UUID:', broadcastId);
    
    // Now test batch processing with the real UUID
    const recipients = [];
    for (let i = 0; i < 75; i++) {
      recipients.push(`+27${String(i).padStart(9, '0')}`);
    }
    
    const testPayload = {
      broadcast_id: broadcastId, // Use the real UUID
      message: 'Testing batch processing with proper UUID',
      recipients: recipients,
      moment_id: null
    };
    
    console.log('📦 Testing batch processing with 75 recipients...');
    
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
    console.log('📄 Response:', result);
    
    if (response.ok) {
      const data = JSON.parse(result);
      
      if (data.batches_created && data.batches_created > 0) {
        console.log('🎉 BATCH PROCESSING IS WORKING!');
        console.log(`📦 Batches created: ${data.batches_created}`);
        console.log(`✅ Success: ${data.success_count}/${data.total_recipients}`);
      } else {
        console.log('⚠️ Batch processing not triggered or failed');
      }
    }
    
    // Cleanup
    await fetch(`${createBroadcastUrl}?id=eq.${broadcastId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        'apikey': process.env.SUPABASE_SERVICE_KEY
      }
    });
    
    console.log('🧹 Cleaned up test broadcast');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testWithProperUUID();