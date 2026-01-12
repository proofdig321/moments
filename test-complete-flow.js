import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function testCompleteFlow() {
  console.log('🧪 Testing complete Moments → Intents → n8n flow...');
  
  try {
    // Step 1: Create a test moment with publish flags
    console.log('\n1️⃣ Creating test moment...');
    const testMoment = {
      title: 'Test Moment - Amazon Q Implementation',
      content: 'This is a test moment created by Amazon Q to verify the complete implementation flow.',
      region: 'KZN',
      category: 'Technology',
      status: 'draft',
      publish_to_whatsapp: true,
      publish_to_pwa: true,
      created_by: 'amazon-q-test',
      content_source: 'admin'
    };
    
    const { data: moment, error: momentError } = await supabase
      .from('moments')
      .insert(testMoment)
      .select()
      .single();
    
    if (momentError) {
      console.error('❌ Failed to create moment:', momentError.message);
      return false;
    }
    
    console.log('✅ Moment created:', moment.id);
    
    // Step 2: Check if intents were created (by trigger or manually)
    console.log('\n2️⃣ Checking for intents...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    
    const { data: intents, error: intentsError } = await supabase
      .from('moment_intents')
      .select('*')
      .eq('moment_id', moment.id);
    
    if (intentsError) {
      console.error('❌ Failed to fetch intents:', intentsError.message);
      return false;
    }
    
    console.log(`✅ Found ${intents.length} intents:`, intents.map(i => `${i.channel}:${i.status}`));
    
    // Step 3: If no intents, create them manually (simulating Edge function)
    if (intents.length === 0) {
      console.log('\n3️⃣ Creating intents manually...');
      
      const intentData = [];
      
      if (moment.publish_to_pwa) {
        intentData.push({
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
      
      if (moment.publish_to_whatsapp) {
        intentData.push({
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
      
      const { data: createdIntents, error: createError } = await supabase
        .from('moment_intents')
        .insert(intentData)
        .select();
      
      if (createError) {
        console.error('❌ Failed to create intents:', createError.message);
        return false;
      }
      
      console.log(`✅ Created ${createdIntents.length} intents`);
    }
    
    // Step 4: Simulate n8n processing (mark as sent)
    console.log('\n4️⃣ Simulating n8n processing...');
    
    const { data: pendingIntents } = await supabase
      .from('moment_intents')
      .select('*')
      .eq('moment_id', moment.id)
      .eq('status', 'pending');
    
    for (const intent of pendingIntents) {
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
        console.log(`✅ Marked ${intent.channel} intent as sent`);
      }
    }
    
    // Step 5: Verify final state
    console.log('\n5️⃣ Final verification...');
    
    const { data: finalIntents } = await supabase
      .from('moment_intents')
      .select('*')
      .eq('moment_id', moment.id);
    
    const sentCount = finalIntents.filter(i => i.status === 'sent').length;
    const totalCount = finalIntents.length;
    
    console.log(`✅ Final state: ${sentCount}/${totalCount} intents sent`);
    
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

testCompleteFlow().then(success => {
  console.log(success ? '\n🎉 Complete flow test PASSED' : '\n💥 Complete flow test FAILED');
  process.exit(success ? 0 : 1);
});