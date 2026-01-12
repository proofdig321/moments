import bcrypt from 'bcrypt';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  'https://arqeiadudzwbmzdhqkit.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFycWVpYWR1ZHp3Ym16ZGhxa2l0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU5OCwiZXhwIjoyMDgxNzk0NTk4fQ.WyolKqTVdblr1r8eCjOOaBuMq2uLAJIM_0YC3n3M7s8'
);

async function recreateAdmin() {
  try {
    // Delete existing admin
    const { error: deleteError } = await supabase
      .from('admin_users')
      .delete()
      .eq('id', 'ac3c0a64-4668-48d3-9d12-52477e2fddc0');
    
    if (deleteError) {
      console.error('Error deleting old admin:', deleteError);
      return;
    }
    
    console.log('✅ Old admin deleted');
    
    // Hash the new password
    const password = 'Proof321#';
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Create new admin user
    const { data, error } = await supabase
      .from('admin_users')
      .insert([
        {
          email: 'info@unamifoundation.org',
          name: 'Main Admin',
          password_hash: passwordHash,
          active: true
        }
      ])
      .select();
    
    if (error) {
      console.error('Error creating new admin user:', error);
      return;
    }
    
    console.log('✅ New admin user created successfully:', data[0]);
    console.log('📧 Email: info@unamifoundation.org');
    console.log('🔑 Password: Proof321#');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

recreateAdmin();