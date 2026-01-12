import { test, describe } from 'node:test';
import assert from 'node:assert';

// Test utilities and helpers
export const createMockMessage = (overrides = {}) => {
  return {
    id: 'test_msg_123',
    from: '27123456789',
    type: 'text',
    timestamp: '1640995200',
    text: { body: 'Test message' },
    ...overrides
  };
};

export const createMockWebhookPayload = (messages = []) => {
  return {
    entry: [{
      changes: [{
        value: {
          messages: messages.length > 0 ? messages : [createMockMessage()]
        }
      }]
    }]
  };
};

export const mockSupabaseResponse = (data = [], error = null) => {
  return { data, error };
};

describe('Test Utilities', () => {
  test('should create mock message', () => {
    const message = createMockMessage();
    assert.strictEqual(message.id, 'test_msg_123');
    assert.strictEqual(message.type, 'text');
  });

  test('should create mock message with overrides', () => {
    const message = createMockMessage({ type: 'image', from: '27987654321' });
    assert.strictEqual(message.type, 'image');
    assert.strictEqual(message.from, '27987654321');
  });

  test('should create webhook payload', () => {
    const payload = createMockWebhookPayload();
    assert(payload.entry);
    assert(payload.entry[0].changes);
    assert(payload.entry[0].changes[0].value.messages);
  });
});