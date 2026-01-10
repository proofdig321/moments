import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function testAdminMomentsPipeline() {
  console.log('🧪 Testing Admin Moments Pipeline\n');
  
  try {
    // 1. Create admin moment with PWA distribution
    console.log('1. Creating admin moment (PWA only)...');
    const testMoment = {
      title: 'Admin Test: Community Workshop',
      content: 'This is a test moment created by admin.\n\nFeatures:\n- Line breaks preserved\n- Markdown formatting\n- Immediate PWA display',
      region: 'GP',
      category: 'Education',
      status: 'broadcasted',
      publish_to_pwa: true,
      publish_to_whatsapp: false,
      created_by: 'test_admin'
    };
    
    const { data: moment, error: momentError } = await supabase
      .from('moments')
      .insert(testMoment)
      .select()
      .single();
    
    if (momentError) throw momentError;
    console.log('✅ Admin moment created:', moment.id);
    
    // 2. Check if PWA intent was created
    console.log('\n2. Checking PWA intent creation...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for trigger
    
    const { data: pwaIntent } = await supabase
      .from('moment_intents')
      .select('*')
      .eq('moment_id', moment.id)
      .eq('channel', 'pwa')
      .single();
    
    if (pwaIntent) {
      console.log('✅ PWA intent created:', pwaIntent.status);
    } else {
      console.log('❌ PWA intent not found');
    }
    
    // 3. Check if moment appears in PWA API
    console.log('\n3. Checking PWA API visibility...');
    const { data: pwaResponse } = await supabase
      .from('moments')
      .select('id, title, content, region, category, content_source, status')
      .eq('id', moment.id)
      .eq('status', 'broadcasted')
      .single();
    
    if (pwaResponse) {
      console.log('✅ Moment visible in PWA API');
      console.log('   Title:', pwaResponse.title);
      console.log('   Source:', pwaResponse.content_source);
      console.log('   Status:', pwaResponse.status);
    } else {
      console.log('❌ Moment not visible in PWA API');
    }
    
    // 4. Test manual WhatsApp broadcast
    console.log('\n4. Testing manual WhatsApp broadcast...');
    
    // Simulate manual broadcast (update moment to enable WhatsApp)
    const { data: updatedMoment, error: updateError } = await supabase\n      .from('moments')\n      .update({ \n        publish_to_whatsapp: true,\n        broadcasted_at: new Date().toISOString()\n      })\n      .eq('id', moment.id)\n      .select()\n      .single();\n    \n    if (updateError) throw updateError;\n    \n    // Check if WhatsApp intent was created\n    await new Promise(resolve => setTimeout(resolve, 1000));\n    \n    const { data: whatsappIntent } = await supabase\n      .from('moment_intents')\n      .select('*')\n      .eq('moment_id', moment.id)\n      .eq('channel', 'whatsapp')\n      .single();\n    \n    if (whatsappIntent) {\n      console.log('✅ WhatsApp intent created:', whatsappIntent.status);\n    } else {\n      console.log('❌ WhatsApp intent not found');\n    }\n    \n    // 5. Check all intents for this moment\n    console.log('\n5. All moment intents:');\n    const { data: allIntents } = await supabase\n      .from('moment_intents')\n      .select('channel, status, created_at')\n      .eq('moment_id', moment.id)\n      .order('created_at', { ascending: true });\n    \n    if (allIntents && allIntents.length > 0) {\n      allIntents.forEach(intent => {\n        console.log(`   ${intent.channel}: ${intent.status}`);\n      });\n    } else {\n      console.log('   No intents found');\n    }\n    \n    // 6. Pipeline summary\n    console.log('\n6. Pipeline Summary:');\n    const { data: adminMoments } = await supabase\n      .from('moments')\n      .select('content_source')\n      .eq('content_source', 'admin')\n      .eq('status', 'broadcasted');\n    \n    const { data: pendingIntents } = await supabase\n      .from('moment_intents')\n      .select('channel')\n      .eq('status', 'pending');\n    \n    console.log('   Admin moments (broadcasted):', adminMoments?.length || 0);\n    console.log('   Pending intents:', pendingIntents?.length || 0);\n    \n    console.log('\n🎉 Admin moments pipeline test completed!');\n    console.log('\n📋 Expected Flow:');\n    console.log('   1. Admin creates moment ✅');\n    console.log('   2. PWA intent created ✅');\n    console.log('   3. PWA displays immediately ✅');\n    console.log('   4. WhatsApp intent (on demand) ✅');\n    console.log('   5. N8N processes WhatsApp within 1 minute');\n    \n  } catch (error) {\n    console.error('❌ Test failed:', error.message);\n  }\n}\n\n// Run test\ntestAdminMomentsPipeline();