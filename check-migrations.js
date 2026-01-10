import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function checkMigrations() {
  try {
    console.log('🔍 Checking database state...');
    console.log('URL:', process.env.SUPABASE_URL?.substring(0, 30) + '...');
    
    // Check if moment_intents table exists
    const { data, error } = await supabase
      .from('moment_intents')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ moment_intents table does not exist:', error.message);
      console.log('🔧 Need to apply migrations');
      return false;
    }
    
    console.log('✅ moment_intents table exists');
    
    // Check if publish columns exist in moments table
    const { data: moments, error: momentsError } = await supabase
      .from('moments')
      .select('publish_to_whatsapp, publish_to_pwa')
      .limit(1);
      
    if (momentsError) {
      console.log('❌ publish columns missing from moments table:', momentsError.message);
      return false;
    }
    
    console.log('✅ publish columns exist in moments table');
    
    // Check for existing test data
    const { data: testMoments, error: testError } = await supabase
      .from('moments')
      .select('id, title')
      .limit(5);
      
    console.log('📊 Existing moments:', testMoments?.length || 0);
    
    return true;
  } catch (err) {
    console.log('❌ Migration check failed:', err.message);
    return false;
  }
}

checkMigrations().then(success => {
  console.log(success ? '✅ Database ready' : '❌ Database needs setup');
  process.exit(success ? 0 : 1);
});