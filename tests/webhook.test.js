import { test, describe, mock } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import express from 'express';
import { handleWebhook, verifyWebhook } from '../src/webhook.js';

// Mock dependencies
mock.method(console, 'error', () => {});

const app = express();
app.use(express.json());
app.get('/webhook', verifyWebhook);
app.post('/webhook', handleWebhook);

describe('Webhook Tests', () => {
  test('should verify webhook with correct token', async () => {
    process.env.WEBHOOK_VERIFY_TOKEN = 'test_token';
    
    const response = await request(app)
      .get('/webhook')
      .query({
        'hub.mode': 'subscribe',
        'hub.verify_token': 'test_token',
        'hub.challenge': 'test_challenge'
      });
    
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.text, 'test_challenge');
  });

  test('should reject webhook with wrong token', async () => {
    const response = await request(app)
      .get('/webhook')
      .query({
        'hub.mode': 'subscribe',
        'hub.verify_token': 'wrong_token',
        'hub.challenge': 'test_challenge'
      });
    
    assert.strictEqual(response.status, 403);
  });

  test('should handle empty webhook payload', async () => {
    const response = await request(app)
      .post('/webhook')
      .send({});
    
    assert.strictEqual(response.status, 200);
  });

  test('should handle webhook with no messages', async () => {
    const payload = {
      entry: [{
        changes: [{
          value: {}
        }]
      }]
    };
    
    const response = await request(app)
      .post('/webhook')
      .send(payload);
    
    assert.strictEqual(response.status, 200);
  });
});