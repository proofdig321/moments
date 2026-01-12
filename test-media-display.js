#!/usr/bin/env node

/**
 * Test Media Display Functionality
 * Tests both PWA and admin dashboard media rendering
 */

import { supabase } from './config/supabase.js';

async function testMediaDisplay() {
  console.log('🔍 Testing Media Display Functionality...\n');

  try {
    // 1. Check if moments have media URLs
    console.log('1. Checking moments with media...');
    const { data: momentsWithMedia, error: momentsError } = await supabase
      .from('moments')
      .select('id, title, media_urls, status')
      .not('media_urls', 'is', null)
      .neq('media_urls', '{}')
      .limit(5);

    if (momentsError) throw momentsError;

    if (momentsWithMedia && momentsWithMedia.length > 0) {
      console.log(`✅ Found ${momentsWithMedia.length} moments with media:`);
      momentsWithMedia.forEach(moment => {
        console.log(`   - ${moment.title}: ${moment.media_urls?.length || 0} media files`);
        if (moment.media_urls && moment.media_urls.length > 0) {
          moment.media_urls.forEach((url, i) => {
            console.log(`     [${i + 1}] ${url}`);
          });
        }
      });
    } else {
      console.log('⚠️  No moments with media found');
    }

    // 2. Check media table for processed files
    console.log('\n2. Checking processed media files...');
    const { data: mediaFiles, error: mediaError } = await supabase
      .from('media')
      .select('id, media_type, storage_path, bucket_name, processed, created_at')
      .eq('processed', true)
      .limit(5);

    if (mediaError) throw mediaError;

    if (mediaFiles && mediaFiles.length > 0) {
      console.log(`✅ Found ${mediaFiles.length} processed media files:`);
      mediaFiles.forEach(media => {
        console.log(`   - ${media.media_type}: ${media.storage_path} (${media.bucket_name})`);
        
        // Generate public URL
        const { data: urlData } = supabase.storage
          .from(media.bucket_name)
          .getPublicUrl(media.storage_path);
        
        if (urlData?.publicUrl) {
          console.log(`     URL: ${urlData.publicUrl}`);
        } else {
          console.log('     ❌ No public URL generated');
        }
      });
    } else {
      console.log('⚠️  No processed media files found');
    }

    // 3. Test storage buckets
    console.log('\n3. Checking storage buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) throw bucketsError;

    if (buckets && buckets.length > 0) {
      console.log(`✅ Found ${buckets.length} storage buckets:`);
      buckets.forEach(bucket => {
        console.log(`   - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
      });

      // Check files in each bucket
      for (const bucket of buckets) {
        try {
          const { data: files, error: filesError } = await supabase.storage
            .from(bucket.name)
            .list('', { limit: 3 });

          if (!filesError && files && files.length > 0) {
            console.log(`     Files in ${bucket.name}: ${files.length}`);
            files.forEach(file => {
              console.log(`       - ${file.name} (${file.metadata?.size || 'unknown size'})`);
            });
          }
        } catch (error) {
          console.log(`     ❌ Cannot list files in ${bucket.name}: ${error.message}`);
        }
      }
    } else {
      console.log('⚠️  No storage buckets found');
    }

    // 4. Test media URL accessibility
    console.log('\n4. Testing media URL accessibility...');
    if (momentsWithMedia && momentsWithMedia.length > 0) {
      const testMoment = momentsWithMedia[0];
      if (testMoment.media_urls && testMoment.media_urls.length > 0) {
        const testUrl = testMoment.media_urls[0];
        console.log(`Testing URL: ${testUrl}`);
        
        try {
          const response = await fetch(testUrl, { method: 'HEAD' });
          if (response.ok) {
            console.log(`✅ URL accessible (${response.status})`);
            console.log(`   Content-Type: ${response.headers.get('content-type')}`);
            console.log(`   Content-Length: ${response.headers.get('content-length')}`);
          } else {
            console.log(`❌ URL not accessible (${response.status})`);
          }
        } catch (error) {
          console.log(`❌ URL test failed: ${error.message}`);
        }
      }
    }

    console.log('\n📊 Media Display Test Summary:');
    console.log('- Check PWA at: /moments');
    console.log('- Check Admin at: /admin-dashboard.html');
    console.log('- Media should display with proper fallbacks');
    console.log('- Images should show thumbnails');
    console.log('- Videos should show play buttons');
    console.log('- Audio should show controls');
    console.log('- Documents should show file icons');

  } catch (error) {
    console.error('❌ Media display test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testMediaDisplay().then(() => {
  console.log('\n✅ Media display test completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});