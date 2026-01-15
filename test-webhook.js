#!/usr/bin/env node

import { config } from 'dotenv';

config();

async function testBroadcastWebhook() {
  try {
    console.log('🧪 Testing broadcast webhook...');
    
    const webhookUrl = `${process.env.SUPABASE_URL}/functions/v1/broadcast-webhook`;
    
    // Test with small recipient list (should use sequential processing)
    const testPayload = {
      broadcast_id: 'test-' + Date.now(),
      message: 'Test message for broadcast webhook',
      recipients: ['+27123456789', '+27987654321'], // Only 2 recipients
      moment_id: null
    };
    
    console.log('📡 Calling broadcast webhook...');
    console.log('📱 Recipients:', testPayload.recipients.length);
    
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
      console.log('✅ Broadcast webhook is working');
    } else {
      console.log('❌ Broadcast webhook failed');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testBroadcastWebhook();