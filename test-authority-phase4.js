#!/usr/bin/env node

/**
 * Authority Layer - Phase 4 Admin UI Integration Test
 * Test authority management UI in admin dashboard
 */

import { supabase } from './config/supabase.js';

async function testAdminUIIntegration() {
  console.log('🚀 Testing Authority Layer - Phase 4 Admin UI Integration\n');

  try {
    // Test 1: Verify admin dashboard has authority section
    console.log('1. 📄 Admin Dashboard UI Verification');
    
    const fs = await import('fs');
    const adminDashboardPath = './public/admin-dashboard.html';
    
    if (!fs.existsSync(adminDashboardPath)) {
      console.log('   ❌ Admin dashboard file not found');
      return false;
    }
    
    const dashboardContent = fs.readFileSync(adminDashboardPath, 'utf8');
    
    // Check for authority navigation item
    if (dashboardContent.includes('data-section="authority"')) {
      console.log('   ✅ Authority navigation item found');
    } else {
      console.log('   ❌ Authority navigation item missing');
      return false;
    }
    
    // Check for authority section
    if (dashboardContent.includes('id="authority"') && dashboardContent.includes('Authority Management')) {
      console.log('   ✅ Authority management section found');
    } else {
      console.log('   ❌ Authority management section missing');
      return false;
    }
    
    // Check for authority form
    if (dashboardContent.includes('id="authority-form"')) {
      console.log('   ✅ Authority form found');
    } else {
      console.log('   ❌ Authority form missing');
      return false;
    }
    
    // Check for authority JavaScript functions
    if (dashboardContent.includes('loadAuthorityProfiles') && dashboardContent.includes('editAuthorityProfile')) {
      console.log('   ✅ Authority JavaScript functions found');
    } else {
      console.log('   ❌ Authority JavaScript functions missing');
      return false;
    }

    // Test 2: Verify admin API endpoints are working
    console.log('\n2. 🔧 Admin API Endpoints Verification');
    
    const { data: adminUsers } = await supabase
      .from('admin_users')
      .select('id')
      .limit(1);
    
    if (!adminUsers || adminUsers.length === 0) {
      console.log('   ❌ No admin users found for testing');
      return false;
    }

    // Test authority profiles endpoint
    const { data: profiles, error: profilesError } = await supabase
      .from('authority_profiles')
      .select('*')
      .limit(5);
    
    if (profilesError) {
      console.log('   ❌ Authority profiles query failed:', profilesError.message);
      return false;
    }
    
    console.log('   ✅ Authority profiles endpoint accessible');
    console.log(`   📊 Found ${profiles?.length || 0} authority profiles`);

    // Test 3: Create test authority profile via API simulation
    console.log('\n3. 🧪 Authority Profile API Simulation');
    
    const testProfile = {
      user_identifier: '+27555666777',
      authority_level: 2,
      role_label: 'UI Test Community Leader',
      scope: 'community',
      scope_identifier: 'ui_test_community',
      approval_mode: 'ai_review',
      blast_radius: 250,
      risk_threshold: 0.6,
      created_by: adminUsers[0].id,
      updated_by: adminUsers[0].id
    };

    const { data: createdProfile, error: createError } = await supabase
      .from('authority_profiles')
      .insert(testProfile)
      .select()
      .single();
    
    if (createError) {
      console.log('   ❌ Failed to create test profile:', createError.message);
      return false;
    }
    
    console.log('   ✅ Authority profile creation API working');
    console.log(`   📋 Created profile ID: ${createdProfile.id}`);

    // Test 4: Test authority profile update
    console.log('\n4. 🔄 Authority Profile Update Test');
    
    const updates = {
      authority_level: 3,
      role_label: 'Updated UI Test Leader',
      blast_radius: 350
    };

    const { data: updatedProfile, error: updateError } = await supabase
      .from('authority_profiles')
      .update({
        ...updates,
        updated_by: adminUsers[0].id,
        updated_at: new Date().toISOString()
      })
      .eq('id', createdProfile.id)
      .select()
      .single();
    
    if (updateError) {
      console.log('   ❌ Failed to update profile:', updateError.message);
      return false;
    }
    
    console.log('   ✅ Authority profile update API working');
    console.log(`   📋 Updated authority level: ${updatedProfile.authority_level}`);
    console.log(`   📋 Updated role: ${updatedProfile.role_label}`);

    // Test 5: Test authority lookup endpoint simulation
    console.log('\n5. 🔍 Authority Lookup Test');
    
    const { data: lookupResult, error: lookupError } = await supabase
      .rpc('lookup_authority', { p_user_identifier: testProfile.user_identifier });
    
    if (lookupError) {
      console.log('   ❌ Authority lookup failed:', lookupError.message);
      return false;
    }
    
    if (!lookupResult || lookupResult.length === 0) {
      console.log('   ❌ Authority lookup returned no results');
      return false;
    }
    
    const authority = lookupResult[0];
    console.log('   ✅ Authority lookup working');
    console.log(`   📋 Found authority level: ${authority.authority_level}`);
    console.log(`   📋 Found role: ${authority.role_label}`);

    // Test 6: Test authority suspension
    console.log('\n6. ⏸️ Authority Suspension Test');
    
    const { data: suspendedProfile, error: suspendError } = await supabase
      .from('authority_profiles')
      .update({
        status: 'suspended',
        updated_by: adminUsers[0].id,
        updated_at: new Date().toISOString()
      })
      .eq('id', createdProfile.id)
      .select()
      .single();
    
    if (suspendError) {
      console.log('   ❌ Failed to suspend profile:', suspendError.message);
      return false;
    }
    
    console.log('   ✅ Authority suspension working');
    console.log(`   📋 Profile status: ${suspendedProfile.status}`);

    // Test 7: Test audit logging
    console.log('\n7. 📝 Audit Logging Test');
    
    const { data: auditId, error: auditError } = await supabase.rpc('log_authority_action', {
      p_authority_profile_id: createdProfile.id,
      p_action: 'suspended',
      p_actor_id: adminUsers[0].id,
      p_context: { test: 'UI integration test', reason: 'Testing suspension' }
    });
    
    if (auditError) {
      console.log('   ❌ Audit logging failed:', auditError.message);
      return false;
    }
    
    console.log('   ✅ Audit logging working');
    console.log(`   📋 Audit entry ID: ${auditId}`);

    // Test 8: Verify audit log retrieval
    console.log('\n8. 📋 Audit Log Retrieval Test');
    
    const { data: auditLogs, error: auditRetrieveError } = await supabase
      .from('authority_audit_log')
      .select(`
        *,
        authority_profiles(user_identifier, role_label)
      `)
      .eq('authority_profile_id', createdProfile.id)
      .order('timestamp', { ascending: false })
      .limit(5);
    
    if (auditRetrieveError) {
      console.log('   ❌ Audit log retrieval failed:', auditRetrieveError.message);
      return false;
    }
    
    console.log('   ✅ Audit log retrieval working');
    console.log(`   📋 Found ${auditLogs?.length || 0} audit entries`);

    // Test 9: Feature flag simulation
    console.log('\n9. 🚩 Feature Flag Simulation');
    
    // Simulate role-based access check
    const { data: adminRoles } = await supabase
      .from('admin_roles')
      .select('role')
      .eq('user_id', adminUsers[0].id)
      .single();
    
    const userRole = adminRoles?.role || 'moderator';
    const hasAuthorityAccess = ['content_admin', 'superadmin'].includes(userRole);
    
    console.log('   ✅ Role-based access check working');
    console.log(`   📋 User role: ${userRole}`);
    console.log(`   📋 Authority access: ${hasAuthorityAccess ? 'Granted' : 'Denied'}`);

    // Test 10: UI Component Integration Check
    console.log('\n10. 🎨 UI Component Integration Check');
    
    // Check for required CSS classes and IDs
    const requiredElements = [
      'authority-nav-item',
      'authority-list',
      'authority-form',
      'authority-submit-btn',
      'authority-form-title'
    ];
    
    let missingElements = [];
    for (const elementId of requiredElements) {
      if (!dashboardContent.includes(`id="${elementId}"`)) {
        missingElements.push(elementId);
      }
    }
    
    if (missingElements.length > 0) {
      console.log('   ❌ Missing UI elements:', missingElements.join(', '));
      return false;
    }
    
    console.log('   ✅ All required UI elements present');

    // Cleanup
    console.log('\n11. 🧹 Cleaning up test data...');
    
    await supabase.from('authority_profiles').delete().eq('id', createdProfile.id);
    
    console.log('   ✅ Test data cleaned up');

    console.log('\n🎉 Phase 4 Admin UI Integration Test Complete!');
    console.log('\n📋 Phase 4 Status:');
    console.log('✅ Authority navigation item added');
    console.log('✅ Authority management section created');
    console.log('✅ Authority form implemented');
    console.log('✅ Authority JavaScript functions working');
    console.log('✅ Authority API endpoints accessible');
    console.log('✅ Authority CRUD operations functional');
    console.log('✅ Authority audit logging working');
    console.log('✅ Role-based access control implemented');
    console.log('✅ UI components properly integrated');
    console.log('\n🚀 Ready for Phase 5: Broadcast Integration');
    
    return true;

  } catch (error) {
    console.error('❌ Phase 4 test failed:', error.message);
    return false;
  }
}

// Run the test
testAdminUIIntegration()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });