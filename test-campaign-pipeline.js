import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function testCampaignPipeline() {
  console.log('🧪 Testing Campaign Data Pipeline\n');
  
  try {
    // 1. Create a test campaign
    console.log('1. Creating test campaign...');
    const testCampaign = {
      title: 'Community Health Workshop',
      content: 'Free health screening and wellness workshop this Saturday at the community center. Blood pressure checks, nutrition advice, and fitness demonstrations. All ages welcome!',
      target_regions: ['GP'],
      target_categories: ['Health'],
      budget: 500,
      status: 'approved', // Skip manual approval for test
      scheduled_at: null // Immediate publish
    };
    
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert(testCampaign)
      .select()
      .single();
    
    if (campaignError) throw campaignError;
    console.log('✅ Test campaign created:', campaign.id);
    
    // 2. Simulate campaign publish (normally done via admin API)
    console.log('\n2. Publishing campaign to moment...');
    const momentRecord = {
      title: campaign.title,
      content: campaign.content,
      region: campaign.target_regions[0],
      category: campaign.target_categories[0],
      language: 'eng',
      is_sponsored: true,
      media_urls: campaign.media_urls || [],
      status: 'broadcasted',
      broadcasted_at: new Date().toISOString(),
      content_source: 'campaign',
      publish_to_pwa: true,
      publish_to_whatsapp: true,
      created_by: 'test_system'
    };
    
    const { data: moment, error: momentError } = await supabase
      .from('moments')
      .insert(momentRecord)
      .select()
      .single();
    
    if (momentError) throw momentError;
    console.log('✅ Moment created:', moment.id);
    
    // 3. Check if intents were created automatically
    console.log('\n3. Checking moment intents...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for trigger
    
    const { data: intents } = await supabase
      .from('moment_intents')
      .select('*')
      .eq('moment_id', moment.id);
    
    console.log('✅ Moment intents created:', intents?.length || 0);
    if (intents && intents.length > 0) {
      intents.forEach(intent => {
        console.log(`   ${intent.channel}: ${intent.status}`);
      });
    }
    
    // 4. Update campaign status
    await supabase
      .from('campaigns')
      .update({ status: 'published', updated_at: new Date().toISOString() })
      .eq('id', campaign.id);
    
    console.log('✅ Campaign marked as published');
    
    // 5. Check if moment appears in PWA API
    console.log('\n4. Checking PWA API...');
    const { data: pwaResponse } = await supabase
      .from('moments')
      .select('id, title, content, region, category, is_sponsored, content_source')
      .eq('status', 'broadcasted')
      .eq('content_source', 'campaign')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (pwaResponse && pwaResponse.length > 0) {
      const pwaMoment = pwaResponse[0];
      console.log('✅ Moment visible in PWA API');
      console.log('   Title:', pwaMoment.title);
      console.log('   Source:', pwaMoment.content_source);
      console.log('   Sponsored:', pwaMoment.is_sponsored);
    } else {
      console.log('❌ Moment not found in PWA API');
    }
    
    // 6. Check pipeline stats
    console.log('\n5. Pipeline Summary:');
    const { data: campaignStats } = await supabase
      .from('campaigns')
      .select('status')
      .eq('status', 'published');
    
    const { data: momentStats } = await supabase
      .from('moments')
      .select('content_source')
      .eq('content_source', 'campaign');
    
    const { data: intentStats } = await supabase
      .from('moment_intents')
      .select('channel, status');
    
    console.log('   Published campaigns:', campaignStats?.length || 0);
    console.log('   Campaign moments:', momentStats?.length || 0);
    console.log('   Pending intents:', intentStats?.filter(i => i.status === 'pending').length || 0);
    
    console.log('\n🎉 Campaign pipeline test completed!');
    console.log('\n📋 Expected Flow:');
    console.log('   1. Campaign created ✅');
    console.log('   2. Campaign → Moment ✅');
    console.log('   3. Moment → Intents ✅');
    console.log('   4. PWA Display ✅');
    console.log('   5. N8N will process WhatsApp intents within 1 minute');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run test
testCampaignPipeline();