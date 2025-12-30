import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Use Supabase Session Pooler for Railway IPv4 compatibility
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Convert to pooler URL for Railway
const poolerUrl = supabaseUrl.replace('.supabase.co', '.pooler.supabase.com');

const supabase = createClient(poolerUrl, supabaseServiceKey, {
  auth: { persistSession: false },
  db: { 
    schema: 'public',
    // Use session pooler mode
    pool_mode: 'session'
  }
});

const supabaseAnon = createClient(poolerUrl, supabaseAnonKey, {
  auth: { persistSession: false },
  db: { schema: 'public' }
});

console.log('Supabase initialized with session pooler for Railway IPv4');

export { supabase, supabaseAnon };