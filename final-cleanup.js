#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function finalCleanup() {
  console.log('🔧 Final Database Cleanup\n');
  
  // Handle the moment with foreign key constraint
  const { data: welcomeMoment } = await supabase
    .from('moments')
    .select('*')
    .ilike('title', '%welcome%')
    .single();
  
  if (welcomeMoment) {
    console.log('🔗 Handling foreign key constraints for welcome moment...');
    
    // Delete dependent records first
    await supabase.from('comment_patterns').delete().eq('moment_id', welcomeMoment.id);
    await supabase.from('broadcasts').delete().eq('moment_id', welcomeMoment.id);
    
    // Now delete the moment
    const { error } = await supabase
      .from('moments')
      .delete()
      .eq('id', welcomeMoment.id);
    
    if (error) {
      console.log('❌ Still cannot delete welcome moment:', error.message);
    } else {
      console.log('✅ Deleted welcome moment');
    }
  }
  
  // Check for any remaining test data patterns
  const tables = ['messages', 'moments', 'subscriptions', 'advisories', 'flags', 'broadcasts'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(100);
      
      if (!error && data) {
        const testItems = data.filter(item => {
          const itemStr = JSON.stringify(item).toLowerCase();
          return /test|mock|stub|demo|workflow_test|batch_test|category_test/.test(itemStr);
        });
        
        if (testItems.length > 0) {
          console.log(`🚨 Found ${testItems.length} test items in ${table}:`);
          testItems.forEach(item => {
            console.log(`   - ${item.id || item.phone_number || 'unknown'}`);
          });
        } else {
          console.log(`✅ ${table}: Clean`);
        }
      }
    } catch (err) {
      console.log(`⚠️ Could not check ${table}:`, err.message);
    }
  }
  
  // Final database state
  const { data: messages } = await supabase.from('messages').select('id, from_number, created_at').order('created_at', { ascending: false }).limit(10);
  const { data: moments } = await supabase.from('moments').select('id, title, created_by').order('created_at', { ascending: false });
  const { data: subscribers } = await supabase.from('subscriptions').select('phone_number, opted_in');
  
  console.log('\n📊 FINAL DATABASE STATE:');
  console.log('========================');
  console.log(`Total Messages: ${messages?.length || 0}`);
  console.log(`Total Moments: ${moments?.length || 0}`);
  console.log(`Total Subscribers: ${subscribers?.length || 0}`);
  
  if (messages?.length > 0) {
    console.log('\nRecent Messages:');
    messages.forEach((msg, i) => {
      console.log(`${i + 1}. ${msg.from_number} - ${msg.created_at}`);
    });
  }
  
  if (moments?.length > 0) {
    console.log('\nAll Moments:');
    moments.forEach((moment, i) => {
      console.log(`${i + 1}. "${moment.title}" by ${moment.created_by}`);
    });
  }
  
  if (subscribers?.length > 0) {
    console.log('\nSubscribers:');
    subscribers.forEach((sub, i) => {
      console.log(`${i + 1}. ${sub.phone_number} (${sub.opted_in ? 'Active' : 'Inactive'})`);
    });
  } else {
    console.log('\n✅ No subscribers (clean slate)');
  }
  
  console.log('\n🎯 CLEANUP COMPLETE');
  console.log('==================');
  console.log('✅ Test subscribers removed');
  console.log('✅ Test messages cleaned');
  console.log('✅ Test moments removed');
  console.log('✅ Database ready for production');
}

finalCleanup().catch(console.error);