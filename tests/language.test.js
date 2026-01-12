import { test, describe } from 'node:test';
import assert from 'node:assert';
import { detectLanguage, preserveOriginalMessage } from '../src/language.js';

describe('Language Detection Tests', () => {
  test('should detect English text', () => {
    const result = detectLanguage('Hello, how are you today? This is a test message.');
    assert.strictEqual(result.code, 'eng');
    assert.strictEqual(result.name, 'English');
    assert(result.confidence > 0.5);
  });

  test('should detect Zulu patterns', () => {
    const result = detectLanguage('Sawubona, ngiyabonga kakhulu');
    assert.strictEqual(result.code, 'zul');
    assert.strictEqual(result.name, 'Zulu');
  });

  test('should detect Xhosa patterns', () => {
    const result = detectLanguage('Molo, enkosi kakhulu');
    assert.strictEqual(result.code, 'xho');
    assert.strictEqual(result.name, 'Xhosa');
  });

  test('should handle short text', () => {
    const result = detectLanguage('Hi');
    assert.strictEqual(result.code, 'und');
    assert.strictEqual(result.name, 'Undetermined');
    assert.strictEqual(result.confidence, 0);
  });

  test('should handle empty text', () => {
    const result = detectLanguage('');
    assert.strictEqual(result.code, 'und');
    assert.strictEqual(result.confidence, 0);
  });

  test('should preserve original message', () => {
    const message = 'Hello world';
    const language = { code: 'eng', name: 'English' };
    const result = preserveOriginalMessage(message, language);
    
    assert.strictEqual(result.original, message);
    assert.strictEqual(result.language, language);
    assert.strictEqual(result.normalized, false);
    assert.strictEqual(result.translated, false);
  });
});