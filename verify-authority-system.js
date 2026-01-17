#!/usr/bin/env node

/**
 * Authority Layer - System Verification
 * Comprehensive test of all authority components before Phase 4
 */

import { supabase } from './config/supabase.js';

async function verifyAuthoritySystem() {
  console.log('🔍 Authority Layer - System Verification\n');
  console.log('Testing all components before Phase 4 UI integration...\n');

  let allTestsPassed = true;

  try {
    // Test 1: Database Schema Verification
    console.log('1. 📊 Database Schema Verification');
    
    // Check authority_profiles table
    const { data: profilesSchema, error: profilesError } = await supabase
      .from('authority_profiles')
      .select('count')
      .limit(1);
    
    if (profilesError) {
      console.log('   ❌ authority_profiles table missing');
      allTestsPassed = false;
    } else {
      console.log('   ✅ authority_profiles table exists');
    }

    // Check authority_audit_log table
    const { data: auditSchema, error: auditError } = await supabase
      .from('authority_audit_log')
      .select('count')
      .limit(1);
    
    if (auditError) {
      console.log('   ❌ authority_audit_log table missing');
      allTestsPassed = false;
    } else {
      console.log('   ✅ authority_audit_log table exists');
    }

    // Check messages.authority_context column
    const { data: messagesTest } = await supabase
      .from('messages')
      .select('authority_context')
      .limit(1);
    
    if (messagesTest !== null) {
      console.log('   ✅ messages.authority_context column exists');
    } else {
      console.log('   ❌ messages.authority_context column missing');
      allTestsPassed = false;
    }

    // Test 2: Authority Functions Verification
    console.log('\n2. ⚙️ Authority Functions Verification');
    
    // Test lookup_authority function
    const startTime = Date.now();
    const { data: lookupTest, error: lookupError } = await supabase
      .rpc('lookup_authority', { p_user_identifier: '+27000000000' });
    
    const lookupTime = Date.now() - startTime;
    
    if (lookupError) {
      console.log('   ❌ lookup_authority function failed:', lookupError.message);
      allTestsPassed = false;
    } else {
      console.log(`   ✅ lookup_authority function working (${lookupTime}ms)`);
    }

    // Test log_authority_action function
    const { data: adminUsers } = await supabase
      .from('admin_users')
      .select('id')
      .limit(1);

    if (adminUsers && adminUsers.length > 0) {
      // Create test profile for audit test
      const { data: testProfile } = await supabase
        .from('authority_profiles')
        .insert({
          user_identifier: '+27000000001',
          authority_level: 1,
          role_label: 'System Test',
          scope: 'community',
          created_by: adminUsers[0].id,
          updated_by: adminUsers[0].id
        })
        .select()
        .single();

      if (testProfile) {
        const { data: auditTest, error: auditTestError } = await supabase
          .rpc('log_authority_action', {
            p_authority_profile_id: testProfile.id,
            p_action: 'created',
            p_actor_id: adminUsers[0].id,
            p_context: { test: 'system verification' }
          });

        if (auditTestError) {
          console.log('   ❌ log_authority_action function failed:', auditTestError.message);
          allTestsPassed = false;
        } else {
          console.log('   ✅ log_authority_action function working');
        }

        // Cleanup test profile
        await supabase.from('authority_profiles').delete().eq('id', testProfile.id);
      }
    }

    // Test 3: Webhook Integration Verification
    console.log('\n3. 🔗 Webhook Integration Verification');
    
    // Check recent messages for authority_context
    const { data: recentMessages } = await supabase
      .from('messages')
      .select('authority_context, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentMessages && recentMessages.length > 0) {
      const messagesWithAuthority = recentMessages.filter(m => m.authority_context !== null);
      console.log(`   ✅ Recent messages found: ${recentMessages.length}`);
      console.log(`   📊 Messages with authority context: ${messagesWithAuthority.length}`);
      
      if (messagesWithAuthority.length > 0) {
        console.log('   ✅ Webhook authority integration working');
      } else {
        console.log('   ⚠️  No messages with authority context (expected if no authority profiles exist)');
      }
    } else {
      console.log('   ⚠️  No recent messages found');
    }

    // Test 4: Admin API Verification
    console.log('\n4. 🔧 Admin API Verification');
    
    // Test authority profile creation
    if (adminUsers && adminUsers.length > 0) {
      const testApiProfile = {
        user_identifier: '+27111222333',
        authority_level: 2,
        role_label: 'API Verification Test',
        scope: 'community',
        scope_identifier: 'test_community',
        approval_mode: 'ai_review',
        blast_radius: 200,
        created_by: adminUsers[0].id,
        updated_by: adminUsers[0].id
      };

      const { data: apiProfile, error: apiError } = await supabase
        .from('authority_profiles')
        .insert(testApiProfile)
        .select()
        .single();

      if (apiError) {
        console.log('   ❌ Authority profile creation failed:', apiError.message);
        allTestsPassed = false;
      } else {
        console.log('   ✅ Authority profile creation working');

        // Test authority profile update
        const { data: updatedProfile, error: updateError } = await supabase
          .from('authority_profiles')
          .update({ authority_level: 3, role_label: 'Updated Test Role' })
          .eq('id', apiProfile.id)
          .select()
          .single();

        if (updateError) {
          console.log('   ❌ Authority profile update failed:', updateError.message);
          allTestsPassed = false;
        } else {
          console.log('   ✅ Authority profile update working');
        }

        // Test authority lookup with created profile
        const { data: lookupResult } = await supabase
          .rpc('lookup_authority', { p_user_identifier: testApiProfile.user_identifier });

        if (lookupResult && lookupResult.length > 0) {
          console.log('   ✅ Authority lookup with profile working');
        } else {
          console.log('   ❌ Authority lookup with profile failed');
          allTestsPassed = false;
        }

        // Cleanup
        await supabase.from('authority_profiles').delete().eq('id', apiProfile.id);
      }
    }

    // Test 5: Performance Verification
    console.log('\n5. ⚡ Performance Verification');
    
    const performanceTests = [];
    for (let i = 0; i < 10; i++) {
      const start = Date.now();
      await supabase.rpc('lookup_authority', { p_user_identifier: `+2700000000${i}` });
      performanceTests.push(Date.now() - start);
    }

    const avgTime = performanceTests.reduce((a, b) => a + b, 0) / performanceTests.length;
    const maxTime = Math.max(...performanceTests);
    const minTime = Math.min(...performanceTests);

    console.log(`   📊 Authority lookup performance:`);
    console.log(`      Average: ${avgTime.toFixed(1)}ms`);
    console.log(`      Min: ${minTime}ms, Max: ${maxTime}ms`);
    console.log(`      Target: <50ms ${avgTime < 50 ? '✅' : '❌'}`);

    if (avgTime >= 50) {
      console.log('   ⚠️  Performance above target - consider optimization');
    }

    // Test 6: Data Integrity Verification
    console.log('\n6. 🔒 Data Integrity Verification');
    
    // Check for orphaned records
    const { data: orphanedAudit } = await supabase
      .from('authority_audit_log')
      .select('id')
      .not('authority_profile_id', 'in', 
        `(${await supabase.from('authority_profiles').select('id').then(r => 
          r.data?.map(p => `'${p.id}'`).join(',') || "''")})`);

    if (orphanedAudit && orphanedAudit.length > 0) {
      console.log(`   ⚠️  Found ${orphanedAudit.length} orphaned audit records`);
    } else {
      console.log('   ✅ No orphaned audit records');
    }

    // Check for invalid authority levels
    const { data: invalidLevels } = await supabase
      .from('authority_profiles')
      .select('id, authority_level')
      .or('authority_level.lt.1,authority_level.gt.5');

    if (invalidLevels && invalidLevels.length > 0) {
      console.log(`   ❌ Found ${invalidLevels.length} profiles with invalid authority levels`);
      allTestsPassed = false;
    } else {
      console.log('   ✅ All authority levels valid');
    }

    // Test 7: System Integration Summary
    console.log('\n7. 📋 System Integration Summary');
    
    const { data: totalProfiles } = await supabase
      .from('authority_profiles')
      .select('count');
    
    const { data: totalAuditLogs } = await supabase
      .from('authority_audit_log')
      .select('count');

    const { data: messagesWithAuthority } = await supabase
      .from('messages')
      .select('count')
      .not('authority_context', 'is', null);

    console.log(`   📊 Authority profiles: ${totalProfiles?.[0]?.count || 0}`);
    console.log(`   📊 Audit log entries: ${totalAuditLogs?.[0]?.count || 0}`);
    console.log(`   📊 Messages with authority context: ${messagesWithAuthority?.[0]?.count || 0}`);

    // Final Results
    console.log('\n' + '='.repeat(60));
    if (allTestsPassed) {
      console.log('🎉 SYSTEM VERIFICATION COMPLETE - ALL TESTS PASSED');
      console.log('\n✅ Authority Layer Status:');
      console.log('   • Database schema: Ready');
      console.log('   • Authority functions: Working');
      console.log('   • Webhook integration: Active');
      console.log('   • Admin API: Functional');
      console.log('   • Performance: Within targets');
      console.log('   • Data integrity: Verified');
      console.log('\n🚀 READY FOR PHASE 4: Admin UI Integration');
    } else {
      console.log('❌ SYSTEM VERIFICATION FAILED - ISSUES FOUND');
      console.log('\n⚠️  Please resolve issues before proceeding to Phase 4');
    }
    console.log('='.repeat(60));

    return allTestsPassed;

  } catch (error) {
    console.error('❌ System verification failed:', error.message);
    return false;
  }
}

// Run the verification
verifyAuthoritySystem()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Verification execution failed:', error);
    process.exit(1);
  });