import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export async function createMomentIntents(moment) {
  try {
    console.log(`🔧 Creating intents for moment: ${moment.id}`);
    
    const createdIntents = [];
    
    // Helper: check for existing intents for that moment+channel
    async function existingIntentFor(channel) {
      const { data, error } = await supabase
        .from('moment_intents')
        .select('*')
        .eq('moment_id', moment.id)
        .eq('channel', channel);
      
      if (error) throw error;
      return data && data.length > 0 ? data : null;
    }
    
    // Create an intent row
    async function createIntent(channel, payload = {}, template_id = null) {
      const intentData = {
        moment_id: moment.id,
        channel: channel,
        action: 'publish',
        status: 'pending',
        template_id: template_id,
        payload: payload
      };
      
      const { data, error } = await supabase
        .from('moment_intents')
        .insert(intentData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
    
    // PWA intent
    if (moment.publish_to_pwa || moment.publish_to_pwa === undefined) {
      const existing = await existingIntentFor('pwa');
      if (existing) {
        createdIntents.push(...existing.map(r => r.id));
        console.log('✅ PWA intent already exists');
      } else {
        const payload = { 
          title: moment.title, 
          full_text: moment.content, 
          link: moment.pwa_link || `https://moments.unamifoundation.org/m/${moment.id}`
        };
        const row = await createIntent('pwa', payload, null);
        if (row) {
          createdIntents.push(row.id);
          console.log('✅ PWA intent created');
        }
      }
    }
    
    // WhatsApp intent: only if explicitly allowed
    if (moment.publish_to_whatsapp) {
      const existing = await existingIntentFor('whatsapp');
      if (existing) {
        createdIntents.push(...existing.map(r => r.id));
        console.log('✅ WhatsApp intent already exists');
      } else {
        const payload = { 
          title: moment.title, 
          summary: moment.content.substring(0, 100) + '...', 
          link: moment.pwa_link || `https://moments.unamifoundation.org/m/${moment.id}`
        };
        const row = await createIntent('whatsapp', payload, 'marketing_v1');
        if (row) {
          createdIntents.push(row.id);
          console.log('✅ WhatsApp intent created');
        }
      }
    }
    
    return { moment_id: moment.id, intents: createdIntents };
  } catch (error) {
    console.error('❌ Failed to create intents:', error.message);
    throw error;
  }
}

// If called directly, test with a sample moment
if (import.meta.url === `file://${process.argv[1]}`) {
  async function test() {
    const { data: moments } = await supabase
      .from('moments')
      .select('*')
      .limit(1);
    
    if (moments && moments.length > 0) {
      const testMoment = {
        ...moments[0],
        publish_to_whatsapp: true,
        publish_to_pwa: true
      };
      
      const result = await createMomentIntents(testMoment);
      console.log('🎉 Test result:', result);
    } else {
      console.log('❌ No moments found for testing');
    }
  }
  
  test().catch(console.error);
}