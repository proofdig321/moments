import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Railway has IPv4 connectivity issues with some Supabase instances
// Use connection pooler or direct IP if available
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

let supabase, supabaseAnon;

try {
  // Try with connection pooler for Railway compatibility
  const poolerUrl = supabaseUrl.replace('.supabase.co', '.pooler.supabase.com');
  
  supabase = createClient(poolerUrl, supabaseServiceKey, {
    auth: { persistSession: false },
    db: { schema: 'public' },
    global: {
      headers: {
        'User-Agent': 'whatsapp-gateway/1.0'
      }
    }
  });
  
  supabaseAnon = createClient(poolerUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    db: { schema: 'public' }
  });
  
  console.log('Supabase clients initialized with pooler');
} catch (error) {
  console.error('Supabase pooler failed, trying direct:', error.message);
  
  try {
    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });
    supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    });
    console.log('Supabase clients initialized direct');
  } catch (directError) {
    console.error('All Supabase connections failed:', directError.message);
    
    // Graceful fallback - system continues without database
    const mockClient = {
      from: (table) => ({
        insert: async (data) => { console.log(`Mock insert to ${table}:`, data); return { data, error: null }; },
        select: async () => ({ data: [], error: null }),
        update: async () => ({ data: [], error: null }),
        eq: function() { return this; },
        single: async () => ({ data: null, error: null }),
        limit: function() { return this; }
      }),
      storage: {
        from: (bucket) => ({
          upload: async () => ({ data: { path: 'mock/path' }, error: null }),
          getPublicUrl: () => ({ data: { publicUrl: 'https://mock.url' } })
        })
      }
    };
    
    supabase = mockClient;
    supabaseAnon = mockClient;
    console.log('Using mock Supabase - messages will be logged only');
  }
}

export { supabase, supabaseAnon };