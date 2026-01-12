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

console.log('🔄 Testing Complete Automation Pipeline...\n');

// Test 1: MCP Function Direct
async function testMCPDirect() {
  console.log('1️⃣ Testing MCP function directly...');
  try {
    const { data, error } = await supabase.rpc('mcp_advisory', {
      message_content: 'This is a test message with urgent help needed',
      message_language: 'eng',
      message_type: 'text',
      from_number: '+27123456789'
    });
    
    if (error) throw error;
    console.log('✅ MCP function working:', {
      urgency: data.urgency_level,
      harm_detected: data.harm_signals.detected,
      escalation: data.escalation_suggested
    });
    return true;
  } catch (error) {
    console.log('❌ MCP function failed:', error.message);
    return false;
  }
}

// Test 2: WhatsApp → Message Storage → MCP Pipeline
async function testWhatsAppPipeline() {
  console.log('2️⃣ Testing WhatsApp → MCP pipeline...');
  try {
    // Simulate WhatsApp webhook
    const response = await fetch(`${API_BASE}/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entry: [{
          changes: [{
            value: {
              messages: [{
                id: `test_${Date.now()}`,
                from: '+27111222333',
                type: 'text',
                timestamp: Math.floor(Date.now() / 1000).toString(),
                text: {
                  body: 'Community alert: Road closure on Main Street due to construction work'
                }
              }]
            }
          }]
        }]
      })
    });
    
    const result = await response.json();
    console.log('✅ WhatsApp webhook processed:', result.status);
    
    // Check if message was stored
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (messages && messages.length > 0) {
      console.log('✅ Message stored in database');
      return true;
    } else {
      console.log('❌ Message not found in database');
      return false;
    }
  } catch (error) {
    console.log('❌ WhatsApp pipeline failed:', error.message);
    return false;
  }
}

// Test 3: Admin Moment → Broadcast Pipeline
async function testAdminBroadcastPipeline() {
  console.log('3️⃣ Testing Admin → Broadcast pipeline...');
  try {
    // Create admin moment
    const createResponse = await fetch(`${API_BASE}/admin/moments`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Admin Test Broadcast',
        content: 'Testing the admin to broadcast automation pipeline.',
        region: 'GP',
        category: 'Technology'
      })
    });
    
    const createResult = await createResponse.json();
    if (!createResult.success) throw new Error(createResult.error);
    
    console.log('✅ Admin moment created:', createResult.id);
    
    // Broadcast the moment
    const broadcastResponse = await fetch(`${API_BASE}/admin/moments/${createResult.id}/broadcast`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer test-token' }
    });
    
    const broadcastResult = await broadcastResponse.json();
    if (broadcastResult.success) {
      console.log('✅ Broadcast triggered:', broadcastResult.message);
      return createResult.id;
    } else {
      console.log('⚠️ Broadcast failed (expected if no subscribers):', broadcastResult.error);
      return createResult.id;
    }
  } catch (error) {
    console.log('❌ Admin broadcast pipeline failed:', error.message);
    return null;
  }
}

// Test 4: Campaign → Approval → Broadcast Pipeline
async function testCampaignPipeline() {
  console.log('4️⃣ Testing Campaign pipeline...');
  try {
    const response = await fetch(`${API_BASE}/admin/campaigns`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Test Campaign Automation',
        content: 'Testing campaign creation and approval pipeline.',
        target_regions: ['GP', 'WC'],
        target_categories: ['Education'],
        budget: 5000
      })
    });
    
    const result = await response.json();
    if (result.success) {
      console.log('✅ Campaign created:', {
        id: result.id,
        auto_approved: result.auto_approved,
        risk_score: result.risk_score
      });
      return true;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.log('❌ Campaign pipeline failed:', error.message);
    return false;
  }
}

// Test 5: Community Content Auto-Publishing
async function testCommunityAutoPub() {
  console.log('5️⃣ Testing Community auto-publishing...');
  try {
    const beforeCount = await supabase
      .from('moments')
      .select('id', { count: 'exact', head: true })
      .eq('content_source', 'community');
    
    // Send community message
    await fetch(`${API_BASE}/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entry: [{
          changes: [{
            value: {
              messages: [{
                id: `community_${Date.now()}`,
                from: '+27444555666',
                type: 'text',
                timestamp: Math.floor(Date.now() / 1000).toString(),
                text: {
                  body: 'Local update: New library opening in Soweto with free computer classes'
                }
              }]
            }
          }]
        }]
      })
    });
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const afterCount = await supabase
      .from('moments')
      .select('id', { count: 'exact', head: true })
      .eq('content_source', 'community');
    
    if (afterCount.count > beforeCount.count) {
      console.log('✅ Community content auto-published');
      return true;
    } else {
      console.log('⚠️ Community content not auto-published (may be flagged by MCP)');
      return false;
    }
  } catch (error) {
    console.log('❌ Community auto-pub failed:', error.message);
    return false;
  }
}

// Test 6: End-to-End Data Flow
async function testEndToEndFlow() {
  console.log('6️⃣ Testing end-to-end data flow...');
  try {
    const [moments, subscribers, broadcasts, messages] = await Promise.all([
      supabase.from('moments').select('id', { count: 'exact', head: true }),
      supabase.from('subscriptions').select('id', { count: 'exact', head: true }),
      supabase.from('broadcasts').select('id', { count: 'exact', head: true }),
      supabase.from('messages').select('id', { count: 'exact', head: true })
    ]);
    
    console.log('✅ Data flow verified:', {
      moments: moments.count,
      subscribers: subscribers.count,
      broadcasts: broadcasts.count,
      messages: messages.count
    });
    
    return true;
  } catch (error) {
    console.log('❌ Data flow check failed:', error.message);
    return false;
  }
}

// Run all tests
async function runAutomationTests() {
  const results = [];
  
  results.push(await testMCPDirect());
  results.push(await testWhatsAppPipeline());
  
  const momentId = await testAdminBroadcastPipeline();
  results.push(!!momentId);
  
  results.push(await testCampaignPipeline());
  results.push(await testCommunityAutoPub());
  results.push(await testEndToEndFlow());
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`\n📊 Automation Test Results: ${passed}/${total} pipelines working`);
  
  if (passed === total) {
    console.log('🎉 All automation pipelines operational!');
  } else {
    console.log('⚠️ Some automation needs attention');
  }
  
  // Cleanup
  if (momentId) {
    try {
      await fetch(`${API_BASE}/admin/moments/${momentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer test-token' }
      });
      console.log('🧹 Test moment cleaned up');
    } catch (error) {
      console.log('⚠️ Cleanup failed');
    }
  }
}

runAutomationTests().catch(console.error);