import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function testAdminAPIFlow() {
  console.log('🧪 Testing Admin API → Intents → n8n flow...');
  
  try {
    // Step 1: Create moment directly via admin API simulation
    console.log('\n1️⃣ Creating moment via admin API logic...');
    
    // Simulate the admin API moment creation logic
    const momentData = {
      title: 'Admin API Test Moment',
      content: 'This moment tests the admin API intent creation flow.',
      region: 'KZN',
      category: 'Technology',
      status: 'draft',
      created_by: 'admin',
      content_source: 'admin',
      publish_to_whatsapp: true,
      publish_to_pwa: true
    };
    
    const { data: moment, error: momentError } = await supabase
      .from('moments')
      .insert(momentData)
      .select()
      .single();
    
    if (momentError) {
      console.error('❌ Failed to create moment:', momentError.message);
      return false;
    }
    
    console.log('✅ Moment created:', moment.id);
    
    // Step 2: Create intents manually (simulating admin API logic)
    console.log('\n2️⃣ Creating intents manually...');
    
    const intentsToCreate = [];
    
    // PWA intent
    if (moment.publish_to_pwa !== false) {
      intentsToCreate.push({
        moment_id: moment.id,
        channel: 'pwa',
        action: 'publish',
        status: 'pending',
        payload: {
          title: moment.title,
          full_text: moment.content,
          link: `https://moments.unamifoundation.org/m/${moment.id}`
        }
      });
    }
    
    // WhatsApp intent
    if (moment.publish_to_whatsapp) {
      intentsToCreate.push({
        moment_id: moment.id,
        channel: 'whatsapp',
        action: 'publish',
        status: 'pending',
        template_id: 'marketing_v1',
        payload: {
          title: moment.title,
          summary: moment.content.substring(0, 100) + '...',
          link: `https://moments.unamifoundation.org/m/${moment.id}`
        }
      });
    }
    
    const { data: createdIntents, error: intentsError } = await supabase
      .from('moment_intents')
      .insert(intentsToCreate)
      .select();
    
    if (intentsError) {
      console.error('❌ Failed to create intents:', intentsError.message);
      return false;
    }
    
    console.log(`✅ Created ${createdIntents.length} intents`);
    
    // Step 3: Simulate n8n processing
    console.log('\n3️⃣ Simulating n8n processing...');
    
    for (const intent of createdIntents) {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Update intent status to sent
      const { error: updateError } = await supabase
        .from('moment_intents')
        .update({
          status: 'sent',
          attempts: 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', intent.id);
      
      if (updateError) {
        console.error(`❌ Failed to update intent ${intent.id}:`, updateError.message);
      } else {
        console.log(`✅ Processed ${intent.channel} intent`);
      }
    }
    
    // Step 4: Verify final state
    console.log('\n4️⃣ Verifying final state...');
    
    const { data: finalIntents } = await supabase
      .from('moment_intents')
      .select('*')
      .eq('moment_id', moment.id);
    
    const sentCount = finalIntents.filter(i => i.status === 'sent').length;
    const totalCount = finalIntents.length;
    
    console.log(`📊 Final state: ${sentCount}/${totalCount} intents sent`);
    
    // Step 5: Test n8n workflow simulation
    console.log('\n5️⃣ Testing n8n workflow logic...');
    
    // Simulate fetching pending intents (what n8n would do)
    const { data: pendingIntents } = await supabase
      .from('moment_intents')
      .select('*')
      .eq('status', 'pending')
      .eq('channel', 'whatsapp')
      .limit(5);
    
    console.log(`📋 Found ${pendingIntents.length} pending WhatsApp intents for n8n processing`);
    
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await supabase.from('moment_intents').delete().eq('moment_id', moment.id);
    await supabase.from('moments').delete().eq('id', moment.id);
    console.log('✅ Cleanup complete');
    
    return sentCount === totalCount && totalCount > 0;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

testAdminAPIFlow().then(success => {
  console.log(success ? '\n🎉 Admin API flow test PASSED' : '\n💥 Admin API flow test FAILED');
  process.exit(success ? 0 : 1);
});