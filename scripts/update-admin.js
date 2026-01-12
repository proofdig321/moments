import bcrypt from 'bcrypt';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  'https://arqeiadudzwbmzdhqkit.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFycWVpYWR1ZHp3Ym16ZGhxa2l0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU5OCwiZXhwIjoyMDgxNzk0NTk4fQ.WyolKqTVdblr1r8eCjOOaBuMq2uLAJIM_0YC3n3M7s8'
);

async function updateAdminUser() {
  try {
    // Hash the new password
    const password = 'Proof321#';
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Update existing admin user
    const { data, error } = await supabase
      .from('admin_users')
      .update({
        email: 'info@unamifoundation.org',
        password_hash: passwordHash,
        updated_at: new Date().toISOString()
      })
      .eq('email', 'admin@unamifoundation.org')
      .select();
    
    if (error) {
      console.error('Error updating admin user:', error);
      return;
    }
    
    console.log('✅ Admin user updated successfully:', data[0]);
    console.log('📧 Email: info@unamifoundation.org');
    console.log('🔑 Password: Proof321#');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

updateAdminUser();