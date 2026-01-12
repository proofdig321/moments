import bcrypt from 'bcrypt';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  'https://arqeiadudzwbmzdhqkit.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFycWVpYWR1ZHp3Ym16ZGhxa2l0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU5OCwiZXhwIjoyMDgxNzk0NTk4fQ.WyolKqTVdblr1r8eCjOOaBuMq2uLAJIM_0YC3n3M7s8'
);

async function createFirstAdmin() {
  try {
    // Hash the admin password
    const password = 'UnAmI2024!Secure'; // From your .env
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Insert first admin user
    const { data, error } = await supabase
      .from('admin_users')
      .insert([
        {
          email: 'admin@unamifoundation.org',
          name: 'Main Admin',
          password_hash: passwordHash,
          active: true
        }
      ])
      .select();
    
    if (error) {
      console.error('Error creating admin user:', error);
      return;
    }
    
    console.log('✅ First admin user created successfully:', data[0]);
    console.log('📧 Email: admin@unamifoundation.org');
    console.log('🔑 Password: UnAmI2024!Secure');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

createFirstAdmin();