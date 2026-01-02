import { supabase } from '../config/supabase.js';

export async function healthCheck() {
  const results = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Unami Foundation Moments API',
    version: '1.0.0',
    environment: process.env.RAILWAY_ENVIRONMENT || 'local'
  };

  // Only test external services if environment variables are configured
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    try {
      const { data, error } = await supabase.from('messages').select('count').limit(1);
      if (error) throw error;
      results.supabase = { status: 'connected' };
    } catch (err) {
      results.supabase = { status: 'failed', error: err.message };
      // Don't fail health check if Supabase is down
    }
  } else {
    results.supabase = { status: 'not_configured' };
  }

  return results;
}