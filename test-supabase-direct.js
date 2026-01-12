import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://arqeiadudzwbmzdhqkit.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFycWVpYWR1ZHp3Ym16ZGhxa2l0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU5OCwiZXhwIjoyMDgxNzk0NTk4fQ.WyolKqTVdblr1r8eCjOOaBuMq2uLAJIM_0YC3n3M7s8';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSupabase() {
  try {
    console.log('Testing direct Supabase connection...');
    const { data, error } = await supabase.from('messages').select('count').limit(1);
    
    if (error) {
      console.log('❌ Supabase FAILED:', error.message);
    } else {
      console.log('✅ Supabase SUCCESS:', data);
    }
  } catch (err) {
    console.log('❌ Supabase ERROR:', err.message);
  }
}

testSupabase();