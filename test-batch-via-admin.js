#!/usr/bin/env node

import { config } from 'dotenv';

config();

async function testBatchProcessingViaAdmin() {
  try {
    console.log('🧪 Testing batch processing via admin API...');
    
    const adminUrl = `${process.env.SUPABASE_URL}/functions/v1/admin-api`;
    
    // Login first
    console.log('🔐 Logging in...');
    const loginResponse = await fetch(adminUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'info@unamifoundation.org',
        password: process.env.ADMIN_PASSWORD
      })
    });
    
    const loginResult = await loginResponse.json();
    if (!loginResult.success) {
      console.error('❌ Login failed:', loginResult);
      return;
    }
    
    console.log('✅ Logged in successfully');
    const token = loginResult.token;
    
    // Create a test moment
    console.log('📝 Creating test moment...');
    const momentResponse = await fetch(`${adminUrl}/moments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Batch Processing Test',
        content: 'Testing the new batch processing system for WhatsApp broadcasts',
        region: 'National',
        category: 'Technology',
        publish_to_whatsapp: false // Don't auto-broadcast
      })
    });
    
    const momentResult = await momentResponse.json();
    if (!momentResult.moment) {
      console.error('❌ Failed to create moment:', momentResult);
      return;
    }
    
    console.log('✅ Created test moment:', momentResult.moment.id);
    
    // Trigger broadcast
    console.log('📡 Triggering broadcast...');
    const broadcastResponse = await fetch(`${adminUrl}/moments/${momentResult.moment.id}/broadcast`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const broadcastResult = await broadcastResponse.text();
    console.log('📨 Broadcast response:', broadcastResponse.status);
    console.log('📄 Response:', broadcastResult.substring(0, 500));
    
    if (broadcastResponse.ok) {
      console.log('✅ Broadcast system is working!');
      
      // The admin API will call the broadcast-webhook internally
      // If batch processing is working, it should handle large broadcasts efficiently
      
    } else {
      console.log('❌ Broadcast failed');
    }
    
    // Cleanup - delete the test moment
    await fetch(`${adminUrl}/moments/${momentResult.moment.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('🧹 Cleaned up test moment');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testBatchProcessingViaAdmin();