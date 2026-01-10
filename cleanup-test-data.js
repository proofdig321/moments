#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function cleanupTestData() {
  console.log('🧹 Cleaning Up Test Data\n');
  
  // Check messages for test data
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false });
  
  console.log(`📊 Total messages: ${messages?.length || 0}`);
  
  const testPatterns = [
    /test/i,
    /mock/i,
    /stub/i,
    /demo/i,
    /workflow_test/i,
    /batch_test/i,
    /category_test/i,
    /sql_test/i,
    /manual_test/i,
    /\+27123456789/,
    /\+27987654321/,
    /\+27111222333/
  ];
  
  const testMessages = messages?.filter(msg => 
    testPatterns.some(pattern => 
      pattern.test(msg.whatsapp_id) || 
      pattern.test(msg.from_number) ||
      pattern.test(msg.content || '')
    )
  ) || [];
  
  console.log(`🚨 Test messages found: ${testMessages.length}\n`);
  
  if (testMessages.length > 0) {
    console.log('REMOVING TEST MESSAGES AND RELATED DATA...\n');
    
    for (const msg of testMessages) {
      try {
        // Delete related data first
        await supabase.from('flags').delete().eq('message_id', msg.id);
        await supabase.from('advisories').delete().eq('message_id', msg.id);
        await supabase.from('media').delete().eq('message_id', msg.id);
        
        // Delete the message
        const { error } = await supabase
          .from('messages')
          .delete()
          .eq('id', msg.id);
        
        if (error) {
          console.log(`❌ Failed to delete message ${msg.whatsapp_id}:`, error.message);
        } else {
          console.log(`✅ Deleted: ${msg.whatsapp_id} from ${msg.from_number}`);
        }
      } catch (err) {
        console.log(`❌ Error deleting ${msg.whatsapp_id}:`, err.message);
      }
    }
  }
  
  // Check moments for test data
  const { data: moments } = await supabase
    .from('moments')
    .select('*')
    .order('created_at', { ascending: false });
  
  console.log(`\n📊 Total moments: ${moments?.length || 0}`);
  
  const testMoments = moments?.filter(moment => 
    testPatterns.some(pattern => 
      pattern.test(moment.title || '') ||
      pattern.test(moment.content || '') ||
      pattern.test(moment.created_by || '')
    ) || moment.created_by === 'auto_moderation'
  ) || [];
  
  console.log(`🚨 Test moments found: ${testMoments.length}\n`);
  
  if (testMoments.length > 0) {
    console.log('REMOVING TEST MOMENTS...\n');
    
    for (const moment of testMoments) {
      try {
        // Delete related broadcasts first
        await supabase.from('broadcasts').delete().eq('moment_id', moment.id);
        
        // Delete the moment
        const { error } = await supabase
          .from('moments')
          .delete()
          .eq('id', moment.id);
        
        if (error) {
          console.log(`❌ Failed to delete moment ${moment.title}:`, error.message);
        } else {
          console.log(`✅ Deleted moment: ${moment.title}`);
        }
      } catch (err) {
        console.log(`❌ Error deleting moment ${moment.title}:`, err.message);
      }
    }
  }
  
  // Final summary
  const { data: finalMessages } = await supabase.from('messages').select('id');
  const { data: finalMoments } = await supabase.from('moments').select('id');
  const { data: finalSubscribers } = await supabase.from('subscriptions').select('id');
  
  console.log('\n📊 FINAL DATABASE STATE:');
  console.log('========================');
  console.log(`Messages: ${finalMessages?.length || 0}`);
  console.log(`Moments: ${finalMoments?.length || 0}`);
  console.log(`Subscribers: ${finalSubscribers?.length || 0}`);
  console.log('\n✅ Database cleaned of test data');
}

cleanupTestData().catch(console.error);