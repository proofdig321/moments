import bcrypt from 'bcrypt';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  'https://arqeiadudzwbmzdhqkit.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFycWVpYWR1ZHp3Ym16ZGhxa2l0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU5OCwiZXhwIjoyMDgxNzk0NTk4fQ.WyolKqTVdblr1r8eCjOOaBuMq2uLAJIM_0YC3n3M7s8'
);

async function addPartnerAdmin(email, name, password) {
  try {
    // Hash the password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Get the main admin ID for created_by field
    const { data: mainAdmin } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', 'info@unamifoundation.org')
      .single();
    
    // Create partner admin user
    const { data, error } = await supabase
      .from('admin_users')
      .insert([
        {
          email: email,
          name: name,
          password_hash: passwordHash,
          active: true,
          created_by: mainAdmin?.id
        }
      ])
      .select();
    
    if (error) {
      console.error(`Error creating admin user ${email}:`, error);
      return null;
    }
    
    console.log(`✅ Partner admin created: ${name} (${email})`);
    return data[0];
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    return null;
  }
}

// Example usage - uncomment and modify as needed:
// addPartnerAdmin('partner1@unamifoundation.org', 'Partner Admin 1', 'SecurePass123!');
// addPartnerAdmin('partner2@unamifoundation.org', 'Partner Admin 2', 'SecurePass456!');

console.log('📝 Partner admin creation script ready');
console.log('📧 Main admin: info@unamifoundation.org');
console.log('🔑 Password: Proof321#');
console.log('');
console.log('To add partner admins, uncomment and modify the example calls at the bottom of this script.');

export { addPartnerAdmin };