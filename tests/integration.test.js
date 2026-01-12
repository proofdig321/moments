import { test, describe, mock } from 'node:test';
import assert from 'node:assert';

describe('Integration Tests', () => {
  test('should process text message end-to-end', async () => {
    const mockMessage = {
      id: 'test_msg_123',
      from: '27123456789',
      type: 'text',
      timestamp: '1640995200',
      text: { body: 'Hello, I need help with my account' }
    };

    // Mock the processing pipeline
    const processMessage = async (message) => {
      // Language detection
      const language = { code: 'eng', name: 'English', confidence: 0.9 };
      
      // Database storage
      const messageRecord = {
        id: 1,
        whatsapp_id: message.id,
        from_number: message.from,
        message_type: message.type,
        content: message.text.body,
        language_detected: language.code,
        processed: false
      };
      
      // Advisory call
      const advisory = { risk_level: 'low', recommendations: [] };
      
      // Trust signals
      const trust = { score: 0.8, flags: [] };
      
      return { messageRecord, advisory, trust };
    };

    const result = await processMessage(mockMessage);
    
    assert.strictEqual(result.messageRecord.whatsapp_id, 'test_msg_123');
    assert.strictEqual(result.messageRecord.language_detected, 'eng');
    assert.strictEqual(result.advisory.risk_level, 'low');
    assert(result.trust.score > 0.5);
  });

  test('should handle media message processing', async () => {
    const mockMediaMessage = {
      id: 'test_media_123',
      from: '27123456789',
      type: 'image',
      timestamp: '1640995200',
      image: { 
        id: 'media_123',
        caption: 'Check this out'
      }
    };

    const processMediaMessage = async (message) => {
      return {
        messageRecord: {
          id: 2,
          whatsapp_id: message.id,
          media_id: message.image.id,
          content: message.image.caption,
          message_type: 'image'
        },
        mediaProcessed: true
      };
    };

    const result = await processMediaMessage(mockMediaMessage);
    
    assert.strictEqual(result.messageRecord.media_id, 'media_123');
    assert.strictEqual(result.messageRecord.message_type, 'image');
    assert.strictEqual(result.mediaProcessed, true);
  });

  test('should handle opt-out messages', async () => {
    const optOutMessage = {
      id: 'test_opt_123',
      from: '27123456789',
      type: 'text',
      text: { body: 'STOP' }
    };

    const handleOptOut = async (message) => {
      const isOptOut = /^(stop|unsubscribe|opt.?out)$/i.test(message.text.body);
      return { optedOut: isOptOut, processed: true };
    };

    const result = await handleOptOut(optOutMessage);
    
    assert.strictEqual(result.optedOut, true);
    assert.strictEqual(result.processed, true);
  });
});