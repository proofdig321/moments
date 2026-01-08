#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function setupTestData() {
  console.log('🔧 Setting up test data...');
  
  // 1. Add test subscriber
  const { data: subscriber, error: subError } = await supabase
    .from('subscriptions')
    .upsert({
      phone_number: '+27123456789',
      opted_in: true,
      opted_in_at: new Date().toISOString(),
      last_activity: new Date().toISOString()
    }, { onConflict: 'phone_number' });
  
  if (subError) {
    console.error('❌ Failed to create subscriber:', subError);
    return;
  }
  console.log('✅ Test subscriber created');
  
  // 2. Create and broadcast a moment
  const { data: moment, error: momentError } = await supabase
    .from('moments')
    .insert({
      title: 'Welcome to Unami Moments!',
      content: 'This is your first community update. Stay connected for local news, opportunities, and events across South Africa.',
      region: 'GP',
      category: 'Education',
      status: 'draft',
      created_by: 'admin'
    })
    .select()
    .single();
  
  if (momentError) {
    console.error('❌ Failed to create moment:', momentError);
    return;
  }
  console.log('✅ Test moment created:', moment.id);
  
  // 3. Update moment to broadcasted status
  const { error: updateError } = await supabase
    .from('moments')
    .update({
      status: 'broadcasted',
      broadcasted_at: new Date().toISOString()
    })
    .eq('id', moment.id);
  
  if (updateError) {
    console.error('❌ Failed to update moment:', updateError);
    return;
  }
  
  console.log('✅ Moment marked as broadcasted');
  
  // 4. Check public moments endpoint
  const { data: publicMoments, error: publicError } = await supabase
    .from('moments')
    .select(`
      id,
      title,
      content,
      region,
      category,
      media_urls,
      broadcasted_at,
      is_sponsored,
      content_source,
      sponsors(display_name)
    `)
    .eq('status', 'broadcasted')
    .order('broadcasted_at', { ascending: false });
  
  if (publicError) {
    console.error('❌ Failed to fetch public moments:', publicError);
    return;
  }
  
  console.log('✅ Public moments available:', publicMoments.length);
  console.log('📊 Test setup complete!');
  
  return moment.id;
}

setupTestData().catch(console.error);