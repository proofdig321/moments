import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function testWorkaroundFlow() {
  console.log('🧪 Testing workaround flow (create then update)...');
  
  try {
    // Step 1: Create moment WITHOUT publish flags to avoid trigger
    console.log('\n1️⃣ Creating moment without publish flags...');
    
    const momentData = {
      title: 'Workaround Test Moment',
      content: 'This moment tests the workaround flow to avoid trigger issues.',
      region: 'KZN',
      category: 'Technology',
      status: 'draft',
      created_by: 'admin',
      content_source: 'admin'
      // No publish flags initially
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
    
    // Step 2: Update moment with publish flags
    console.log('\n2️⃣ Updating moment with publish flags...');
    
    const { data: updatedMoment, error: updateError } = await supabase
      .from('moments')
      .update({
        publish_to_whatsapp: true,
        publish_to_pwa: true
      })
      .eq('id', moment.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Failed to update moment:', updateError.message);
      return false;
    }
    
    console.log('✅ Moment updated with publish flags');
    
    // Step 3: Create intents manually
    console.log('\n3️⃣ Creating intents manually...');
    
    const intentsToCreate = [];
    
    // PWA intent
    intentsToCreate.push({
      moment_id: updatedMoment.id,
      channel: 'pwa',
      action: 'publish',
      status: 'pending',
      payload: {
        title: updatedMoment.title,
        full_text: updatedMoment.content,
        link: `https://moments.unamifoundation.org/m/${updatedMoment.id}`
      }
    });
    
    // WhatsApp intent
    intentsToCreate.push({
      moment_id: updatedMoment.id,
      channel: 'whatsapp',
      action: 'publish',
      status: 'pending',
      template_id: 'marketing_v1',
      payload: {
        title: updatedMoment.title,
        summary: updatedMoment.content.substring(0, 100) + '...',
        link: `https://moments.unamifoundation.org/m/${updatedMoment.id}`
      }
    });
    
    const { data: createdIntents, error: intentsError } = await supabase
      .from('moment_intents')
      .insert(intentsToCreate)
      .select();
    
    if (intentsError) {
      console.error('❌ Failed to create intents:', intentsError.message);
      return false;
    }
    
    console.log(`✅ Created ${createdIntents.length} intents`);
    
    // Step 4: Simulate n8n processing
    console.log('\n4️⃣ Simulating n8n processing...');
    
    for (const intent of createdIntents) {
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
    
    // Step 5: Verify final state
    console.log('\n5️⃣ Verifying final state...');
    
    const { data: finalIntents } = await supabase
      .from('moment_intents')
      .select('*')
      .eq('moment_id', updatedMoment.id);
    
    const sentCount = finalIntents.filter(i => i.status === 'sent').length;
    const totalCount = finalIntents.length;
    
    console.log(`📊 Final state: ${sentCount}/${totalCount} intents sent`);
    console.log('📋 Intent details:', finalIntents.map(i => `${i.channel}:${i.status}`));
    
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await supabase.from('moment_intents').delete().eq('moment_id', updatedMoment.id);
    await supabase.from('moments').delete().eq('id', updatedMoment.id);
    console.log('✅ Cleanup complete');
    
    return sentCount === totalCount && totalCount > 0;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

testWorkaroundFlow().then(success => {
  console.log(success ? '\n🎉 Workaround flow test PASSED' : '\n💥 Workaround flow test FAILED');
  process.exit(success ? 0 : 1);
});