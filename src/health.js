import pg from 'pg';
import { supabase } from '../config/supabase.js';

const { Client } = pg;

export async function healthCheck() {
  const results = {
    timestamp: new Date().toISOString(),
    supabase: { status: 'unknown' },
    postgres: { status: 'unknown' }
  };

  // Test Supabase
  try {
    const { data, error } = await supabase.from('messages').select('count').limit(1);
    if (error) throw error;
    results.supabase = { status: 'connected', data };
  } catch (err) {
    results.supabase = { status: 'failed', error: err.message };
  }

  // Test direct PostgreSQL connection
  if (process.env.DATABASE_URL) {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    try {
      await client.connect();
      const result = await client.query('SELECT NOW() as current_time');
      results.postgres = { status: 'connected', time: result.rows[0] };
      await client.end();
    } catch (err) {
      results.postgres = { status: 'failed', error: err.message };
    }
  } else {
    results.postgres = { status: 'no_url', message: 'DATABASE_URL not configured' };
  }

  return results;
}