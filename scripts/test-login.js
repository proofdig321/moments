import bcrypt from 'bcrypt';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://arqeiadudzwbmzdhqkit.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFycWVpYWR1ZHp3Ym16ZGhxa2l0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU5OCwiZXhwIjoyMDgxNzk0NTk4fQ.WyolKqTVdblr1r8eCjOOaBuMq2uLAJIM_0YC3n3M7s8'
);

async function testLogin() {
  try {
    // Get admin user
    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', 'info@unamifoundation.org')
      .eq('active', true)
      .single();
    
    if (error || !admin) {
      console.log('❌ Admin user not found:', error);
      return;
    }
    
    console.log('✅ Admin user found:', admin.email);
    
    // Test password
    const validPassword = await bcrypt.compare('Proof321#', admin.password_hash);
    console.log('🔑 Password valid:', validPassword);
    
    if (validPassword) {
      console.log('✅ Login test successful');
    } else {
      console.log('❌ Password verification failed');
    }
    
  } catch (err) {
    console.error('❌ Test error:', err.message);
  }
}

testLogin();