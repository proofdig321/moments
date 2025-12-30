import express from 'express';
import dotenv from 'dotenv';
import { handleWebhook, verifyWebhook } from './webhook.js';
import { supabase } from '../config/supabase.js';
import { callMCPAdvisory } from './advisory.js';
import { healthCheck } from './health.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', async (req, res) => {
  const health = await healthCheck();
  res.json(health);
});

// Test endpoints
app.get('/test-supabase', async (req, res) => {
  try {
    const { data, error } = await supabase.from('messages').select('count').limit(1);
    if (error) throw error;
    res.json({ status: 'supabase_connected', data });
  } catch (err) {
    res.json({ status: 'supabase_failed', error: err.message });
  }
});

app.get('/test-mcp', async (req, res) => {
  try {
    const testData = {
      id: 'test',
      content: 'test message',
      language_detected: 'eng',
      message_type: 'text',
      from_number: '27123456789',
      timestamp: new Date().toISOString()
    };
    const advisory = await callMCPAdvisory(testData);
    res.json({ status: 'mcp_working', advisory });
  } catch (err) {
    res.json({ status: 'mcp_failed', error: err.message });
  }
});

// WhatsApp webhook endpoints
app.get('/webhook', verifyWebhook);
app.post('/webhook', handleWebhook);

// Error handling
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`WhatsApp Community Gateway running on port ${PORT}`);
  console.log(`Webhook URL: http://localhost:${PORT}/webhook`);
});