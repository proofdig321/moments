#!/usr/bin/env node

import { config } from 'dotenv';

config();

async function verifyDeployment() {
  try {
    console.log('🔍 Verifying broadcast-webhook deployment...');
    
    // Test direct function call
    const webhookUrl = `${process.env.SUPABASE_URL}/functions/v1/broadcast-webhook`;
    
    const response = await fetch(webhookUrl, {
      method: 'OPTIONS', // Test CORS preflight
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`
      }
    });
    
    console.log('📨 CORS preflight response:', response.status);
    
    if (response.status === 200) {
      console.log('✅ broadcast-webhook function is deployed and responding');
      
      // Test with minimal payload
      const testResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          broadcast_id: 'test-deployment',
          message: 'Test deployment',
          recipients: []
        })
      });
      
      const result = await testResponse.text();
      console.log('📄 Test response:', testResponse.status, result.substring(0, 200));
      
    } else {
      console.log('❌ broadcast-webhook function not responding correctly');
    }
    
  } catch (error) {
    console.error('❌ Verification error:', error.message);
  }
}

verifyDeployment();