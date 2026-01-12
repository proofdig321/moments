import { test, describe } from 'node:test';
import request from 'supertest';
import app from '../src/server.js';
import assert from 'assert';

describe('Auth & RBAC System', () => {
  describe('Authentication Required', () => {
    test('GET /admin/moments should return 401 without auth', async () => {
      const res = await request(app).get('/admin/moments');
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.error, 'Unauthorized');
    });

    test('POST /admin/moments should return 401 without auth', async () => {
      const res = await request(app)
        .post('/admin/moments')
        .send({ title: 'Test', content: 'Test content', region: 'KZN', category: 'Education' });
      assert.strictEqual(res.status, 401);
    });

    test('GET /admin/broadcasts should return 401 without auth', async () => {
      const res = await request(app).get('/admin/broadcasts');
      assert.strictEqual(res.status, 401);
    });

    test('POST /admin/broadcasts should return 401 without auth', async () => {
      const res = await request(app)
        .post('/admin/broadcasts')
        .send({ moment_id: 'test-id' });
      assert.strictEqual(res.status, 401);
    });

    test('GET /admin/sponsors should return 401 without auth', async () => {
      const res = await request(app).get('/admin/sponsors');
      assert.strictEqual(res.status, 401);
    });

    test('POST /admin/sponsors should return 401 without auth', async () => {
      const res = await request(app)
        .post('/admin/sponsors')
        .send({ name: 'test', display_name: 'Test Sponsor' });
      assert.strictEqual(res.status, 401);
    });

    test('GET /admin/analytics should return 401 without auth', async () => {
      const res = await request(app).get('/admin/analytics');
      assert.strictEqual(res.status, 401);
    });
  });

  describe('Role Management', () => {
    test('GET /admin/roles should return 401 without auth', async () => {
      const res = await request(app).get('/admin/roles');
      assert.strictEqual(res.status, 401);
    });

    test('POST /admin/roles should return 401 without auth', async () => {
      const res = await request(app)
        .post('/admin/roles')
        .send({ user_id: '12345678-1234-1234-1234-123456789012', role: 'content_admin' });
      assert.strictEqual(res.status, 401);
    });

    test('DELETE /admin/roles/:id should return 401 without auth', async () => {
      const res = await request(app).delete('/admin/roles/test-id');
      assert.strictEqual(res.status, 401);
    });
  });

  describe('Invalid Auth Headers', () => {
    test('should return 401 with malformed Bearer token', async () => {
      const res = await request(app)
        .get('/admin/moments')
        .set('Authorization', 'Bearer invalid-token');
      assert.strictEqual(res.status, 401);
    });

    test('should return 401 with missing Bearer prefix', async () => {
      const res = await request(app)
        .get('/admin/moments')
        .set('Authorization', 'some-token');
      assert.strictEqual(res.status, 401);
    });

    test('should return 401 with empty Authorization header', async () => {
      const res = await request(app)
        .get('/admin/moments')
        .set('Authorization', '');
      assert.strictEqual(res.status, 401);
    });
  });

  describe('Public Endpoints', () => {
    test('GET /health should work without auth', async () => {
      const res = await request(app).get('/health');
      assert.strictEqual(res.status, 200);
    });

    test('GET /webhook should work without auth (verification)', async () => {
      const res = await request(app)
        .get('/webhook')
        .query({ 
          'hub.mode': 'subscribe',
          'hub.verify_token': process.env.WEBHOOK_VERIFY_TOKEN || 'test',
          'hub.challenge': 'test-challenge'
        });
      // Should return challenge or 403, not 401
      assert.notStrictEqual(res.status, 401);
    });

    test('Static files should work without auth', async () => {
      const res = await request(app).get('/manifest.json');
      // Should return file or 404, not 401
      assert.notStrictEqual(res.status, 401);
    });
  });

  describe('Security Headers', () => {
    test('should not expose sensitive information in error responses', async () => {
      const res = await request(app).get('/admin/moments');
      assert.strictEqual(res.status, 401);
      // Should not contain database errors or internal details
      assert.ok(!res.body.error.includes('database'));
      assert.ok(!res.body.error.includes('supabase'));
      assert.ok(!res.body.error.includes('jwt'));
    });
  });
});
