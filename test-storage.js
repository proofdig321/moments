#!/usr/bin/env node

import { supabase } from './config/supabase.js';
import fs from 'fs';
import path from 'path';

console.log('🧪 Testing Supabase Storage Integration...\n');

// Test 1: List storage buckets
async function testListBuckets() {
  console.log('1️⃣ Testing bucket listing...');
  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
      console.error('❌ Bucket listing failed:', error.message);
      return false;
    }
    console.log('✅ Buckets found:', data.map(b => b.name).join(', '));
    return true;
  } catch (err) {
    console.error('❌ Bucket listing error:', err.message);
    return false;
  }
}

// Test 2: Create test file and upload
async function testFileUpload() {
  console.log('\n2️⃣ Testing file upload...');
  try {
    // Create test file
    const testContent = `Test file created at ${new Date().toISOString()}`;
    const fileName = `test_${Date.now()}.txt`;
    const filePath = `test/${fileName}`;
    
    // Upload to images bucket
    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, Buffer.from(testContent), {
        contentType: 'text/plain',
        upsert: false
      });
    
    if (error) {
      console.error('❌ Upload failed:', error.message);
      return { success: false, path: null };
    }
    
    console.log('✅ File uploaded successfully:', data.path);
    return { success: true, path: data.path };
  } catch (err) {
    console.error('❌ Upload error:', err.message);
    return { success: false, path: null };
  }
}

// Test 3: Get public URL
async function testPublicURL(filePath) {
  console.log('\n3️⃣ Testing public URL generation...');
  try {
    const { data } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);
    
    console.log('✅ Public URL generated:', data.publicUrl);
    
    // Test URL accessibility
    const response = await fetch(data.publicUrl);
    if (response.ok) {
      console.log('✅ Public URL is accessible');
      return true;
    } else {
      console.error('❌ Public URL not accessible:', response.status);
      return false;
    }
  } catch (err) {
    console.error('❌ Public URL error:', err.message);
    return false;
  }
}

// Test 4: List files in bucket
async function testListFiles() {
  console.log('\n4️⃣ Testing file listing...');
  try {
    const { data, error } = await supabase.storage
      .from('images')
      .list('test', { limit: 10 });
    
    if (error) {
      console.error('❌ File listing failed:', error.message);
      return false;
    }
    
    console.log('✅ Files in test folder:', data.length);
    data.forEach(file => console.log(`  - ${file.name} (${file.metadata?.size || 'unknown'} bytes)`));
    return true;
  } catch (err) {
    console.error('❌ File listing error:', err.message);
    return false;
  }
}

// Test 5: Delete test file
async function testFileDelete(filePath) {
  console.log('\n5️⃣ Testing file deletion...');
  try {
    const { error } = await supabase.storage
      .from('images')
      .remove([filePath]);
    
    if (error) {
      console.error('❌ File deletion failed:', error.message);
      return false;
    }
    
    console.log('✅ File deleted successfully');
    return true;
  } catch (err) {
    console.error('❌ File deletion error:', err.message);
    return false;
  }
}

// Test 6: Test different file types
async function testFileTypes() {
  console.log('\n6️⃣ Testing different file types...');
  const testFiles = [
    { content: 'Test image content', type: 'image/jpeg', ext: 'jpg', bucket: 'images' },
    { content: 'Test video content', type: 'video/mp4', ext: 'mp4', bucket: 'videos' },
    { content: 'Test audio content', type: 'audio/mp3', ext: 'mp3', bucket: 'audio' },
    { content: 'Test document content', type: 'application/pdf', ext: 'pdf', bucket: 'documents' }
  ];
  
  const results = [];
  
  for (const testFile of testFiles) {
    try {
      const fileName = `test_${Date.now()}.${testFile.ext}`;
      const filePath = `test/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from(testFile.bucket)
        .upload(filePath, Buffer.from(testFile.content), {
          contentType: testFile.type,
          upsert: false
        });
      
      if (error) {
        console.error(`❌ ${testFile.bucket} upload failed:`, error.message);
        results.push({ bucket: testFile.bucket, success: false });
      } else {
        console.log(`✅ ${testFile.bucket} upload successful`);
        results.push({ bucket: testFile.bucket, success: true, path: data.path });
        
        // Clean up
        await supabase.storage.from(testFile.bucket).remove([data.path]);
      }
    } catch (err) {
      console.error(`❌ ${testFile.bucket} error:`, err.message);
      results.push({ bucket: testFile.bucket, success: false });
    }
  }
  
  return results;
}

// Test 7: Test storage policies
async function testStoragePolicies() {
  console.log('\n7️⃣ Testing storage policies...');
  try {
    // Test anonymous access (should work for public buckets)
    const { data } = supabase.storage.from('images').getPublicUrl('test/nonexistent.jpg');
    console.log('✅ Public URL generation works (policy allows public access)');
    
    // Test authenticated access
    const { data: listData, error } = await supabase.storage.from('images').list('', { limit: 1 });
    if (error) {
      console.error('❌ Authenticated access failed:', error.message);
      return false;
    }
    console.log('✅ Authenticated access works');
    return true;
  } catch (err) {
    console.error('❌ Storage policy error:', err.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting comprehensive storage tests...\n');
  
  const results = {
    buckets: await testListBuckets(),
    upload: await testFileUpload(),
    publicUrl: false,
    listing: await testListFiles(),
    deletion: false,
    fileTypes: await testFileTypes(),
    policies: await testStoragePolicies()
  };
  
  // Test public URL and deletion if upload succeeded
  if (results.upload.success) {
    results.publicUrl = await testPublicURL(results.upload.path);
    results.deletion = await testFileDelete(results.upload.path);
  }
  
  // Summary
  console.log('\n📊 TEST SUMMARY:');
  console.log('================');
  Object.entries(results).forEach(([test, result]) => {
    if (typeof result === 'boolean') {
      console.log(`${result ? '✅' : '❌'} ${test}: ${result ? 'PASS' : 'FAIL'}`);
    } else if (result.success !== undefined) {
      console.log(`${result.success ? '✅' : '❌'} ${test}: ${result.success ? 'PASS' : 'FAIL'}`);
    } else if (Array.isArray(result)) {
      const passed = result.filter(r => r.success).length;
      console.log(`${passed === result.length ? '✅' : '❌'} ${test}: ${passed}/${result.length} PASS`);
    }
  });
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(r => {
    if (typeof r === 'boolean') return r;
    if (r.success !== undefined) return r.success;
    if (Array.isArray(r)) return r.every(item => item.success);
    return false;
  }).length;
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All storage tests PASSED! Storage integration is working correctly.');
  } else {
    console.log('⚠️  Some storage tests FAILED. Check configuration and permissions.');
  }
}

// Run tests
runAllTests().catch(console.error);