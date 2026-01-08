#!/usr/bin/env node

import { supabase } from './config/supabase.js';
import fetch from 'node-fetch';

console.log('🧪 Testing All System Features...\n');

const API_BASE = 'http://localhost:3000';
const TEST_TOKEN = 'test_admin_token_12345';

// Test 1: Health Check
async function testHealthCheck() {
  console.log('1️⃣ Testing health check...');
  try {
    const response = await fetch(`${API_BASE}/health`);
    const data = await response.json();
    
    if (response.ok && data.status === 'healthy') {
      console.log('✅ Health check passed');
      return true;
    } else {
      console.error('❌ Health check failed:', data);
      return false;
    }
  } catch (err) {
    console.error('❌ Health check error:', err.message);
    return false;
  }
}

// Test 2: Database Connection
async function testDatabaseConnection() {
  console.log('\n2️⃣ Testing database connection...');
  try {
    const { data, error } = await supabase.from('moments').select('count').limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Database connection successful');
    return true;
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
    return false;
  }
}

// Test 3: MCP Function
async function testMCPFunction() {
  console.log('\n3️⃣ Testing MCP advisory function...');
  try {
    const { data, error } = await supabase.rpc('mcp_advisory', {
      message_content: 'This is a test message for MCP analysis',
      message_language: 'eng',
      message_type: 'test',
      from_number: 'test',
      message_timestamp: new Date().toISOString()
    });
    
    if (error) {
      console.error('❌ MCP function failed:', error.message);
      return false;
    }
    
    if (data && data.language_confidence !== undefined) {
      console.log('✅ MCP function working, confidence:', data.language_confidence);
      return true;
    } else {
      console.error('❌ MCP function returned invalid data:', data);
      return false;
    }
  } catch (err) {
    console.error('❌ MCP function error:', err.message);
    return false;
  }
}

// Test 4: Admin Authentication
async function testAdminAuth() {
  console.log('\n4️⃣ Testing admin authentication...');
  try {
    const response = await fetch(`${API_BASE}/admin/analytics`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Admin authentication working');
      return true;
    } else {
      console.error('❌ Admin authentication failed:', response.status);
      return false;
    }
  } catch (err) {
    console.error('❌ Admin authentication error:', err.message);
    return false;
  }
}

// Test 5: Moments CRUD
async function testMomentsCRUD() {
  console.log('\n5️⃣ Testing Moments CRUD operations...');
  let momentId = null;
  
  try {
    // Create moment
    const createResponse = await fetch(`${API_BASE}/admin/moments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Test Moment',
        content: 'This is a test moment for CRUD testing',
        region: 'GP',
        category: 'Technology'
      })
    });
    
    if (!createResponse.ok) {
      console.error('❌ Moment creation failed:', createResponse.status);
      return false;
    }
    
    const createData = await createResponse.json();
    momentId = createData.id;
    console.log('✅ Moment created successfully');
    
    // Read moments
    const readResponse = await fetch(`${API_BASE}/admin/moments`, {
      headers: { 'Authorization': `Bearer ${TEST_TOKEN}` }
    });
    
    if (!readResponse.ok) {
      console.error('❌ Moment reading failed:', readResponse.status);
      return false;
    }
    
    const readData = await readResponse.json();
    console.log('✅ Moments read successfully, count:', readData.moments?.length || 0);
    
    // Update moment
    const updateResponse = await fetch(`${API_BASE}/admin/moments/${momentId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Updated Test Moment',
        content: 'This is an updated test moment',
        region: 'WC',
        category: 'Education'
      })
    });
    
    if (!updateResponse.ok) {
      console.error('❌ Moment update failed:', updateResponse.status);
      return false;
    }
    
    console.log('✅ Moment updated successfully');
    
    // Delete moment
    const deleteResponse = await fetch(`${API_BASE}/admin/moments/${momentId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${TEST_TOKEN}` }
    });
    
    if (!deleteResponse.ok) {
      console.error('❌ Moment deletion failed:', deleteResponse.status);
      return false;
    }
    
    console.log('✅ Moment deleted successfully');
    return true;
    
  } catch (err) {
    console.error('❌ Moments CRUD error:', err.message);
    return false;
  }
}

// Test 6: Campaigns CRUD
async function testCampaignsCRUD() {
  console.log('\n6️⃣ Testing Campaigns CRUD operations...');
  let campaignId = null;
  
  try {
    // Create campaign
    const createResponse = await fetch(`${API_BASE}/admin/campaigns`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Test Campaign',
        content: 'This is a test campaign for CRUD testing',
        budget: 1000,
        target_regions: ['GP', 'WC'],
        target_categories: ['Technology', 'Education']
      })
    });
    
    if (!createResponse.ok) {
      console.error('❌ Campaign creation failed:', createResponse.status);
      return false;
    }
    
    const createData = await createResponse.json();
    campaignId = createData.id;
    console.log('✅ Campaign created successfully, auto-approved:', createData.auto_approved);
    
    // Read campaigns
    const readResponse = await fetch(`${API_BASE}/admin/campaigns`, {
      headers: { 'Authorization': `Bearer ${TEST_TOKEN}` }
    });
    
    if (!readResponse.ok) {
      console.error('❌ Campaign reading failed:', readResponse.status);
      return false;
    }
    
    const readData = await readResponse.json();
    console.log('✅ Campaigns read successfully, count:', readData.campaigns?.length || 0);
    
    // Activate campaign
    const activateResponse = await fetch(`${API_BASE}/admin/campaigns/${campaignId}/activate`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${TEST_TOKEN}` }
    });
    
    if (!activateResponse.ok) {
      console.error('❌ Campaign activation failed:', activateResponse.status);
      return false;
    }
    
    console.log('✅ Campaign activated successfully');
    
    // Delete campaign
    const deleteResponse = await fetch(`${API_BASE}/admin/campaigns/${campaignId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${TEST_TOKEN}` }
    });
    
    if (!deleteResponse.ok) {
      console.error('❌ Campaign deletion failed:', deleteResponse.status);
      return false;
    }
    
    console.log('✅ Campaign deleted successfully');
    return true;
    
  } catch (err) {
    console.error('❌ Campaigns CRUD error:', err.message);
    return false;
  }
}

// Test 7: Sponsors CRUD
async function testSponsorsCRUD() {
  console.log('\n7️⃣ Testing Sponsors CRUD operations...');
  let sponsorId = null;
  
  try {
    // Create sponsor
    const createResponse = await fetch(`${API_BASE}/admin/sponsors`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'test_sponsor',
        display_name: 'Test Sponsor Ltd',
        contact_email: 'test@sponsor.com',
        website_url: 'https://testsponsor.com'
      })
    });
    
    if (!createResponse.ok) {
      console.error('❌ Sponsor creation failed:', createResponse.status);
      return false;
    }
    
    const createData = await createResponse.json();
    sponsorId = createData.id;
    console.log('✅ Sponsor created successfully');
    
    // Read sponsors
    const readResponse = await fetch(`${API_BASE}/admin/sponsors`, {
      headers: { 'Authorization': `Bearer ${TEST_TOKEN}` }
    });
    
    if (!readResponse.ok) {
      console.error('❌ Sponsor reading failed:', readResponse.status);
      return false;
    }
    
    const readData = await readResponse.json();
    console.log('✅ Sponsors read successfully, count:', readData.sponsors?.length || 0);
    
    return true;
    
  } catch (err) {
    console.error('❌ Sponsors CRUD error:', err.message);
    return false;
  }
}

// Test 8: Media Upload
async function testMediaUpload() {
  console.log('\n8️⃣ Testing media upload...');
  try {
    // Create test file buffer
    const testContent = Buffer.from('Test media file content');
    
    // Create FormData
    const FormData = (await import('form-data')).default;
    const form = new FormData();
    form.append('media_files', testContent, {
      filename: 'test.txt',
      contentType: 'text/plain'
    });
    
    const response = await fetch(`${API_BASE}/admin/upload-media`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        ...form.getHeaders()
      },
      body: form
    });
    
    if (!response.ok) {
      console.error('❌ Media upload failed:', response.status);
      return false;
    }
    
    const data = await response.json();
    if (data.success && data.files?.length > 0) {
      console.log('✅ Media upload successful, files:', data.files.length);
      return true;
    } else {
      console.error('❌ Media upload returned invalid data:', data);
      return false;
    }
    
  } catch (err) {
    console.error('❌ Media upload error:', err.message);
    return false;
  }
}

// Test 9: MCP Stats
async function testMCPStats() {
  console.log('\n9️⃣ Testing MCP statistics...');
  try {
    const response = await fetch(`${API_BASE}/admin/mcp-stats`, {
      headers: { 'Authorization': `Bearer ${TEST_TOKEN}` }
    });
    
    if (!response.ok) {
      console.error('❌ MCP stats failed:', response.status);
      return false;
    }
    
    const data = await response.json();
    console.log('✅ MCP stats retrieved:', {
      analyzed: data.total_analyzed || 0,
      escalations: data.escalations || 0
    });
    return true;
    
  } catch (err) {
    console.error('❌ MCP stats error:', err.message);
    return false;
  }
}

// Test 10: n8n Status
async function testN8nStatus() {
  console.log('\n🔟 Testing n8n status...');
  try {
    const response = await fetch(`${API_BASE}/admin/n8n-status`, {
      headers: { 'Authorization': `Bearer ${TEST_TOKEN}` }
    });
    
    if (!response.ok) {
      console.error('❌ n8n status failed:', response.status);
      return false;
    }
    
    const data = await response.json();
    console.log('✅ n8n status retrieved:', {
      status: data.status,
      workflows: data.total_workflows || 0
    });
    return true;
    
  } catch (err) {
    console.error('❌ n8n status error:', err.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting comprehensive feature tests...\n');
  
  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'Database Connection', fn: testDatabaseConnection },
    { name: 'MCP Function', fn: testMCPFunction },
    { name: 'Admin Authentication', fn: testAdminAuth },
    { name: 'Moments CRUD', fn: testMomentsCRUD },
    { name: 'Campaigns CRUD', fn: testCampaignsCRUD },
    { name: 'Sponsors CRUD', fn: testSponsorsCRUD },
    { name: 'Media Upload', fn: testMediaUpload },
    { name: 'MCP Statistics', fn: testMCPStats },
    { name: 'n8n Status', fn: testN8nStatus }
  ];
  
  const results = {};
  
  for (const test of tests) {
    try {
      results[test.name] = await test.fn();
    } catch (err) {
      console.error(`❌ ${test.name} crashed:`, err.message);
      results[test.name] = false;
    }
  }
  
  // Summary
  console.log('\n📊 FEATURE TEST SUMMARY:');
  console.log('========================');
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASS' : 'FAIL'}`);
  });
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All feature tests PASSED! System is fully functional.');
  } else {
    console.log('⚠️  Some feature tests FAILED. Check system configuration.');
  }
  
  return { passed: passedTests, total: totalTests, results };
}

// Export for use in other scripts
export { runAllTests };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}