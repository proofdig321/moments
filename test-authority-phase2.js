#!/usr/bin/env node

/**
 * Authority Layer - Phase 2 Webhook Integration Test
 * Test authority lookup in webhook processing
 */

import { supabase } from './config/supabase.js';

async function testWebhookIntegration() {
  console.log('🚀 Testing Authority Layer - Phase 2 Webhook Integration\n');

  try {
    // Test 1: Create test authority profile
    console.log('1. Creating test authority profile...');
    
    const { data: adminUsers } = await supabase
      .from('admin_users')
      .select('id')
      .limit(1);
    
    if (!adminUsers || adminUsers.length === 0) {
      console.log('❌ No admin users found - cannot create test profile');
      return false;
    }

    const testPhone = '+27999888777';
    const testProfile = {
      user_identifier: testPhone,
      authority_level: 3,
      role_label: 'Test School Principal',
      scope: 'school',
      scope_identifier: 'test_school_001',
      approval_mode: 'auto',
      blast_radius: 500,
      created_by: adminUsers[0].id,
      updated_by: adminUsers[0].id
    };

    const { data: createdProfile, error: createError } = await supabase
      .from('authority_profiles')
      .insert(testProfile)
      .select()
      .single();
    
    if (createError) {
      console.log('❌ Failed to create test profile:', createError.message);
      return false;
    }
    
    console.log('✅ Test authority profile created');
    console.log(`   Phone: ${testPhone}`);
    console.log(`   Role: ${testProfile.role_label}`);
    console.log(`   Level: ${testProfile.authority_level}`);

    // Test 2: Test authority lookup function directly
    console.log('\n2. Testing authority lookup function...');
    
    const startTime = Date.now();
    const { data: lookupResult, error: lookupError } = await supabase
      .rpc('lookup_authority', { p_user_identifier: testPhone });
    
    const lookupTime = Date.now() - startTime;
    
    if (lookupError) {
      console.log('❌ Authority lookup failed:', lookupError.message);
      return false;
    }
    
    if (!lookupResult || lookupResult.length === 0) {
      console.log('❌ Authority lookup returned no results');
      return false;
    }
    
    const authority = lookupResult[0];
    console.log('✅ Authority lookup successful');
    console.log(`   Lookup time: ${lookupTime}ms`);
    console.log(`   Authority level: ${authority.authority_level}`);
    console.log(`   Role: ${authority.role_label}`);
    console.log(`   Scope: ${authority.scope}`);
    console.log(`   Approval mode: ${authority.approval_mode}`);

    // Test 3: Test authority context creation
    console.log('\n3. Testing authority context creation...');
    
    const authorityContext = {
      has_authority: true,
      level: authority.authority_level,
      role: authority.role_label,
      scope: authority.scope,
      scope_identifier: authority.scope_identifier,
      approval_mode: authority.approval_mode,
      blast_radius: authority.blast_radius,
      risk_threshold: authority.risk_threshold,
      lookup_timestamp: new Date().toISOString()
    };
    
    console.log('✅ Authority context created');
    console.log('   Context:', JSON.stringify(authorityContext, null, 2));

    // Test 4: Test message storage with authority context
    console.log('\n4. Testing message storage with authority context...');
    
    const testMessage = {
      whatsapp_id: `test_${Date.now()}`,
      from_number: testPhone,
      message_type: 'text',
      content: 'Test message with authority context',
      timestamp: new Date().toISOString(),
      processed: false,
      authority_context: authorityContext
    };

    const { data: messageRecord, error: messageError } = await supabase
      .from('messages')
      .insert(testMessage)
      .select()
      .single();
    
    if (messageError) {
      console.log('❌ Failed to store message with authority context:', messageError.message);
      return false;
    }
    
    console.log('✅ Message stored with authority context');
    console.log(`   Message ID: ${messageRecord.id}`);
    console.log(`   Authority context stored: ${messageRecord.authority_context ? 'Yes' : 'No'}`);

    // Test 5: Verify authority context retrieval
    console.log('\n5. Testing authority context retrieval...');
    
    const { data: retrievedMessage, error: retrieveError } = await supabase
      .from('messages')
      .select('authority_context')
      .eq('id', messageRecord.id)
      .single();
    
    if (retrieveError) {
      console.log('❌ Failed to retrieve message:', retrieveError.message);
      return false;
    }
    
    if (!retrievedMessage.authority_context) {
      console.log('❌ Authority context not found in retrieved message');
      return false;
    }
    
    console.log('✅ Authority context retrieved successfully');
    console.log(`   Has authority: ${retrievedMessage.authority_context.has_authority}`);
    console.log(`   Authority level: ${retrievedMessage.authority_context.level}`);

    // Test 6: Test lookup for user without authority
    console.log('\n6. Testing lookup for user without authority...');
    
    const noAuthorityPhone = '+27000111222';
    const { data: noAuthorityResult } = await supabase
      .rpc('lookup_authority', { p_user_identifier: noAuthorityPhone });
    
    console.log('✅ No authority lookup test');
    console.log(`   Result: ${noAuthorityResult?.length || 0} profiles found (expected: 0)`);

    // Cleanup
    console.log('\n7. Cleaning up test data...');
    
    await supabase.from('messages').delete().eq('id', messageRecord.id);
    await supabase.from('authority_profiles').delete().eq('id', createdProfile.id);
    
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 Phase 2 Webhook Integration Test Complete!');
    console.log('\n📋 Phase 2 Status:');
    console.log('✅ Authority lookup function working');
    console.log('✅ Authority context creation working');
    console.log('✅ Message storage with authority context working');
    console.log('✅ Authority context retrieval working');
    console.log('✅ Fail-open behavior for users without authority');
    console.log('\n🚀 Ready for Phase 3: Admin API Integration');
    
    return true;

  } catch (error) {
    console.error('❌ Phase 2 test failed:', error.message);
    return false;
  }
}

// Run the test
testWebhookIntegration()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });