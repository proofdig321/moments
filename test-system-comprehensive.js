#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const API_BASE = 'http://localhost:8080';

console.log('🧪 Starting comprehensive system test...\n');

// Test 1: Health Check
async function testHealthCheck() {
  console.log('1️⃣ Testing health check...');
  try {
    const response = await fetch(`${API_BASE}/health`);
    const data = await response.json();
    console.log('✅ Health check passed:', data.status);
    return true;
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    return false;
  }
}

// Test 2: Database Connection
async function testDatabase() {
  console.log('2️⃣ Testing database connection...');
  try {
    const { data, error } = await supabase.from('moments').select('count', { count: 'exact', head: true });
    if (error) throw error;
    console.log('✅ Database connected, moments count:', data?.length || 0);
    return true;
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    return false;
  }
}

// Test 3: Analytics Endpoint
async function testAnalytics() {
  console.log('3️⃣ Testing analytics endpoint...');
  try {
    const response = await fetch(`${API_BASE}/admin/analytics`, {
      headers: { 'Authorization': 'Bearer test-token' }
    });
    const data = await response.json();
    console.log('✅ Analytics working:', {
      totalMoments: data.totalMoments,
      activeSubscribers: data.activeSubscribers,
      totalBroadcasts: data.totalBroadcasts
    });
    return true;
  } catch (error) {
    console.log('❌ Analytics failed:', error.message);
    return false;
  }
}

// Test 4: Public Moments Endpoint
async function testPublicMoments() {
  console.log('4️⃣ Testing public moments endpoint...');
  try {
    const response = await fetch(`${API_BASE}/public/moments`);
    const data = await response.json();
    console.log('✅ Public moments working, count:', data.moments?.length || 0);
    return true;
  } catch (error) {
    console.log('❌ Public moments failed:', error.message);
    return false;
  }
}

// Test 5: Create Test Moment
async function testCreateMoment() {
  console.log('5️⃣ Testing moment creation...');
  try {
    const testMoment = {
      title: 'Test Moment - System Check',
      content: 'This is a test moment created by the system test script.',
      region: 'GP',
      category: 'Technology',
      status: 'draft'
    };
    
    const response = await fetch(`${API_BASE}/admin/moments`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testMoment)
    });
    
    const data = await response.json();
    if (data.success) {
      console.log('✅ Moment created successfully, ID:', data.id);
      return data.id;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.log('❌ Moment creation failed:', error.message);
    return null;
  }
}

// Test 6: Test Broadcast System
async function testBroadcast(momentId) {
  if (!momentId) {
    console.log('6️⃣ Skipping broadcast test (no moment ID)');
    return false;
  }
  
  console.log('6️⃣ Testing broadcast system...');
  try {
    const response = await fetch(`${API_BASE}/admin/moments/${momentId}/broadcast`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer test-token' }
    });
    
    const data = await response.json();
    if (data.success) {
      console.log('✅ Broadcast triggered successfully:', data.message);
      return true;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.log('❌ Broadcast test failed:', error.message);
    return false;
  }
}

// Test 7: Test Subscribers Endpoint
async function testSubscribers() {
  console.log('7️⃣ Testing subscribers endpoint...');
  try {
    const response = await fetch(`${API_BASE}/admin/subscribers`, {
      headers: { 'Authorization': 'Bearer test-token' }
    });
    const data = await response.json();
    console.log('✅ Subscribers endpoint working, stats:', data.stats);
    return true;
  } catch (error) {
    console.log('❌ Subscribers test failed:', error.message);
    return false;
  }
}

// Test 8: Test Broadcasts History
async function testBroadcastsHistory() {
  console.log('8️⃣ Testing broadcasts history...');
  try {
    const response = await fetch(`${API_BASE}/admin/broadcasts`, {
      headers: { 'Authorization': 'Bearer test-token' }
    });
    const data = await response.json();
    console.log('✅ Broadcasts history working, count:', data.broadcasts?.length || 0);
    return true;
  } catch (error) {
    console.log('❌ Broadcasts history failed:', error.message);
    return false;
  }
}

// Test 9: Test Moderation Endpoint
async function testModeration() {
  console.log('9️⃣ Testing moderation endpoint...');
  try {
    const response = await fetch(`${API_BASE}/admin/moderation`, {
      headers: { 'Authorization': 'Bearer test-token' }
    });
    const data = await response.json();
    console.log('✅ Moderation endpoint working, messages:', data.messages?.length || 0);
    return true;
  } catch (error) {
    console.log('❌ Moderation test failed:', error.message);
    return false;
  }
}

// Test 10: Test PWA Data Flow
async function testPWADataFlow() {
  console.log('🔟 Testing PWA data flow...');
  try {
    const [momentsResponse, statsResponse] = await Promise.all([
      fetch(`${API_BASE}/public/moments`),
      fetch(`${API_BASE}/public/stats`)
    ]);
    
    const momentsData = await momentsResponse.json();
    const statsData = await statsResponse.json();
    
    console.log('✅ PWA data flow working:', {
      moments: momentsData.moments?.length || 0,
      stats: statsData
    });
    return true;
  } catch (error) {
    console.log('❌ PWA data flow failed:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  const results = [];
  
  results.push(await testHealthCheck());
  results.push(await testDatabase());
  results.push(await testAnalytics());
  results.push(await testPublicMoments());
  
  const momentId = await testCreateMoment();
  results.push(!!momentId);
  
  results.push(await testBroadcast(momentId));
  results.push(await testSubscribers());
  results.push(await testBroadcastsHistory());
  results.push(await testModeration());
  results.push(await testPWADataFlow());
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All systems operational!');
  } else {
    console.log('⚠️ Some systems need attention');
  }
  
  // Cleanup test moment
  if (momentId) {
    try {
      await fetch(`${API_BASE}/admin/moments/${momentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer test-token' }
      });
      console.log('🧹 Test moment cleaned up');
    } catch (error) {
      console.log('⚠️ Failed to cleanup test moment');
    }
  }
}

runAllTests().catch(console.error);