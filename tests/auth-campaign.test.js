import request from 'supertest';
import app from '../src/server.js';
import assert from 'assert';

describe('Auth & Campaign API', () => {
  it('GET /admin/campaigns should return 401 without auth', async () => {
    const res = await request(app).get('/admin/campaigns');
    assert.strictEqual(res.status, 401);
  });

  it('POST /admin/campaigns should return 401 without auth', async () => {
    const res = await request(app).post('/admin/campaigns').send({ title: 'x', content: 'y' });
    assert.strictEqual(res.status, 401);
  });

  it('POST /admin/roles should return 401 without auth', async () => {
    const res = await request(app).post('/admin/roles').send({ user_id: 'a', role: 'admin' });
    assert.strictEqual(res.status, 401);
  });
});
