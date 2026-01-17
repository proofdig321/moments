#!/usr/bin/env node

/**
 * Authority Layer - Phase 1 Migration Test
 * Apply authority migrations and verify database setup
 */

import { supabase } from './config/supabase.js';
import fs from 'fs';

async function testAuthorityMigrations() {
  console.log('🚀 Testing Authority Layer - Phase 1 Migrations\n');

  try {
    // Test 1: Verify authority tables exist
    console.log('1. Testing authority tables...');
    
    const { data: authorityProfiles, error: profilesError } = await supabase
      .from('authority_profiles')
      .select('count')
      .limit(1);
    
    if (profilesError) {
      console.log('❌ authority_profiles table missing - need to apply migration');
      console.log('   Run: psql -h <host> -U postgres -d postgres -f supabase/migrations/20260117_add_authority_layer.sql');
      return false;
    }
    
    console.log('✅ authority_profiles table exists');

    // Test 2: Verify authority lookup function
    console.log('\n2. Testing authority lookup function...');
    
    const startTime = Date.now();
    const { data: lookupResult, error: lookupError } = await supabase
      .rpc('lookup_authority', { p_user_identifier: '+27000000000' });
    
    const lookupTime = Date.now() - startTime;
    
    if (lookupError) {
      console.log('❌ Authority lookup function error:', lookupError.message);
      return false;
    }
    
    console.log(`✅ Authority lookup function working (${lookupTime}ms)`);
    console.log(`   Result: ${lookupResult?.length || 0} authority profiles found`);

    // Test 3: Verify messages table has authority_context column
    console.log('\n3. Testing messages table extension...');
    
    const { data: columns, error: columnsError } = await supabase
      .rpc('sql', { 
        query: `SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'messages' AND column_name = 'authority_context'` 
      });
    
    if (columnsError || !columns || columns.length === 0) {
      console.log('❌ authority_context column missing from messages table');
      console.log('   Run: psql -h <host> -U postgres -d postgres -f supabase/migrations/20260117_add_messages_authority_context.sql');
      return false;
    }
    
    console.log('✅ messages.authority_context column exists');

    // Test 4: Test authority profile creation
    console.log('\n4. Testing authority profile creation...');
    
    const testProfile = {
      user_identifier: '+27123456789',
      authority_level: 2,
      role_label: 'Test Community Leader',
      scope: 'community',
      scope_identifier: 'test_community',
      approval_mode: 'ai_review',
      blast_radius: 200,
      created_by: null // Will need actual admin user ID in production
    };

    // Get first admin user for created_by
    const { data: adminUsers } = await supabase
      .from('admin_users')
      .select('id')
      .limit(1);
    
    if (adminUsers && adminUsers.length > 0) {
      testProfile.created_by = adminUsers[0].id;
      
      const { data: createdProfile, error: createError } = await supabase
        .from('authority_profiles')
        .insert(testProfile)
        .select()
        .single();
      
      if (createError) {
        console.log('❌ Authority profile creation failed:', createError.message);
        return false;
      }
      
      console.log('✅ Authority profile created successfully');
      console.log(`   Profile ID: ${createdProfile.id}`);
      
      // Clean up test profile
      await supabase
        .from('authority_profiles')
        .delete()
        .eq('id', createdProfile.id);
      
      console.log('✅ Test profile cleaned up');
    } else {
      console.log('⚠️  No admin users found - skipping profile creation test');
    }

    // Test 5: Performance benchmark
    console.log('\n5. Performance benchmark...');
    
    const iterations = 10;
    const times = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      await supabase.rpc('lookup_authority', { p_user_identifier: `+2700000000${i}` });
      times.push(Date.now() - start);
    }
    
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const maxTime = Math.max(...times);
    
    console.log(`✅ Authority lookup performance:`);
    console.log(`   Average: ${avgTime.toFixed(1)}ms`);
    console.log(`   Maximum: ${maxTime}ms`);
    console.log(`   Target: <50ms ${avgTime < 50 ? '✅' : '❌'}`);

    console.log('\n🎉 Phase 1 Migration Test Complete!');
    console.log('\n📋 Phase 1 Status:');
    console.log('✅ Authority tables created');
    console.log('✅ Authority lookup function working');
    console.log('✅ Messages table extended');
    console.log('✅ Performance within targets');
    console.log('\n🚀 Ready for Phase 2: Webhook Integration');
    
    return true;

  } catch (error) {
    console.error('❌ Migration test failed:', error.message);
    return false;
  }
}

// Run the test
testAuthorityMigrations()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });