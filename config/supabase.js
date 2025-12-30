import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Robust Supabase client with error handling
let supabase, supabaseAnon;

try {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    {
      auth: { persistSession: false },
      global: { fetch: fetch }
    }
  );
  
  supabaseAnon = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      auth: { persistSession: false },
      global: { fetch: fetch }
    }
  );
  
  console.log('Supabase clients initialized');
} catch (error) {
  console.error('Supabase initialization error:', error.message);
  
  // Fallback mock for development
  const mockClient = {
    from: (table) => ({
      insert: async (data) => ({ data, error: null }),
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
}

export { supabase, supabaseAnon };