#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function investigateSubscribers() {
  console.log('🔍 Investigating Subscribers Data\n');
  
  // Get all subscribers
  const { data: subscribers, error } = await supabase
    .from('subscriptions')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.log('❌ Error fetching subscribers:', error.message);
    return;
  }
  
  console.log(`📊 Total subscribers found: ${subscribers.length}\n`);
  
  // Analyze patterns
  const mockPatterns = [
    /test/i,
    /mock/i,
    /stub/i,
    /fake/i,
    /demo/i,
    /example/i,
    /\+27123456789/,
    /\+27987654321/,
    /\+27111222333/,
    /\+27000000000/,
    /\+1234567890/,
    /\+999/
  ];
  
  const suspiciousSubscribers = [];
  
  subscribers.forEach(sub => {
    const isSuspicious = mockPatterns.some(pattern => 
      pattern.test(sub.phone_number) || 
      (sub.id && pattern.test(sub.id))
    );
    
    if (isSuspicious) {
      suspiciousSubscribers.push(sub);
    }
  });
  
  console.log('🚨 SUSPICIOUS SUBSCRIBERS FOUND:');
  console.log('================================');
  
  if (suspiciousSubscribers.length === 0) {
    console.log('✅ No suspicious subscribers found');
  } else {
    suspiciousSubscribers.forEach((sub, index) => {
      console.log(`${index + 1}. Phone: ${sub.phone_number}`);
      console.log(`   ID: ${sub.id}`);
      console.log(`   Created: ${sub.created_at}`);
      console.log(`   Opted In: ${sub.opted_in}`);
      console.log('');
    });
    
    // Remove suspicious subscribers
    console.log('🧹 REMOVING SUSPICIOUS SUBSCRIBERS...\n');
    
    for (const sub of suspiciousSubscribers) {
      try {
        const { error: deleteError } = await supabase
          .from('subscriptions')
          .delete()
          .eq('id', sub.id);
        
        if (deleteError) {
          console.log(`❌ Failed to delete ${sub.phone_number}:`, deleteError.message);
        } else {
          console.log(`✅ Deleted: ${sub.phone_number}`);
        }
      } catch (err) {
        console.log(`❌ Error deleting ${sub.phone_number}:`, err.message);
      }
    }
  }
  
  // Show remaining subscribers
  const { data: remainingSubscribers } = await supabase
    .from('subscriptions')
    .select('phone_number, opted_in, created_at')
    .order('created_at', { ascending: false });
  
  console.log('\n📋 REMAINING SUBSCRIBERS:');
  console.log('========================');
  
  if (remainingSubscribers.length === 0) {
    console.log('No subscribers remaining');
  } else {
    remainingSubscribers.forEach((sub, index) => {
      console.log(`${index + 1}. ${sub.phone_number} (${sub.opted_in ? 'Opted In' : 'Opted Out'}) - ${sub.created_at}`);
    });
  }
  
  console.log(`\n📊 CLEANUP SUMMARY:`);
  console.log(`Removed: ${suspiciousSubscribers.length} suspicious subscribers`);
  console.log(`Remaining: ${remainingSubscribers.length} legitimate subscribers`);
}

investigateSubscribers().catch(console.error);