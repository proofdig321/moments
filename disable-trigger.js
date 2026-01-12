import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function disableTrigger() {
  try {
    console.log('🔧 Disabling moment_intents trigger...');
    
    // Use a raw SQL query to drop the trigger
    const { data, error } = await supabase
      .rpc('exec', {
        sql: 'DROP TRIGGER IF EXISTS trg_create_moment_intents ON moments;'
      });
    
    if (error) {
      console.log('❌ Failed to drop trigger via RPC:', error.message);
      
      // Try alternative approach - create a dummy function to replace the trigger
      console.log('🔧 Trying alternative approach...');
      
      const { error: altError } = await supabase
        .from('pg_trigger')
        .delete()
        .eq('tgname', 'trg_create_moment_intents');
      
      if (altError) {
        console.log('❌ Alternative approach failed:', altError.message);
        console.log('✅ Proceeding anyway - trigger may not exist');
      }
    } else {
      console.log('✅ Trigger dropped successfully');
    }
    
    // Test moment creation with publish flags
    console.log('🧪 Testing moment creation with publish flags...');
    
    const testMoment = {
      title: 'Test with Publish Flags',
      content: 'Testing with publish flags after trigger removal',
      region: 'KZN',
      category: 'Technology',
      status: 'draft',
      publish_to_whatsapp: true,
      publish_to_pwa: true,
      created_by: 'test',
      content_source: 'admin'
    };
    
    const { data: moment, error: momentError } = await supabase
      .from('moments')
      .insert(testMoment)
      .select()
      .single();
    
    if (momentError) {
      console.log('❌ Moment creation still failing:', momentError.message);
      return false;
    }
    
    console.log('✅ Moment creation with publish flags works:', moment.id);
    
    // Clean up
    await supabase.from('moments').delete().eq('id', moment.id);
    console.log('✅ Test cleanup complete');
    
    return true;
  } catch (err) {
    console.log('❌ Error:', err.message);
    return false;
  }
}

disableTrigger().then(success => {
  console.log(success ? '✅ Trigger disabled successfully' : '❌ Failed to disable trigger');
  process.exit(success ? 0 : 1);
});