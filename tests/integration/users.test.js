const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { ensureTestEnvironment, resetTestData } = require('../helpers/setup');
const { api, loginAs, authHeader } = require('../helpers/request');
const { SEED_USERS } = require('../helpers/constants');

describe('User management', { skip: process.env.SKIP_DB_TESTS === 'true' }, () => {
  let dbAvailable;

  before(async () => {
    const env = await ensureTestEnvironment();
    dbAvailable = env.available;
  });

  beforeEach(async () => {
    if (!dbAvailable) return;
    await resetTestData();
  });

  it('lists users with pagination metadata', async (t) => {
    if (!dbAvailable) {
      t.skip('MySQL is not available');
      return;
    }

    const { token } = await loginAs('admin');

    const response = await api()
      .get('/api/v1/users?page=1&limit=10')
      .set(authHeader(token))
      .expect(200);

    assert.equal(response.body.success, true);
    assert.ok(response.body.meta.total >= 4);
    assert.equal(response.body.meta.page, 1);
    assert.equal(response.body.meta.limit, 10);
  });

  it('returns a single user by id', async (t) => {
    if (!dbAvailable) {
      t.skip('MySQL is not available');
      return;
    }

    const { token } = await loginAs('user');

    const response = await api()
      .get(`/api/v1/users/${SEED_USERS.maker.id}`)
      .set(authHeader(token))
      .expect(200);

    assert.equal(response.body.data.email, SEED_USERS.maker.email);
    assert.ok(response.body.data.roles.includes('Maker'));
  });

  it('returns 404 for unknown user', async (t) => {
    if (!dbAvailable) {
      t.skip('MySQL is not available');
      return;
    }

    const { token } = await loginAs('admin');

    const response = await api()
      .get('/api/v1/users/00000000-0000-0000-0000-000000000099')
      .set(authHeader(token))
      .expect(404);

    assert.equal(response.body.error.code, 'NOT_FOUND');
  });

  it('validates create user request body', async (t) => {
    if (!dbAvailable) {
      t.skip('MySQL is not available');
      return;
    }

    const { token } = await loginAs('maker');

    const response = await api()
      .post('/api/v1/users')
      .set(authHeader(token))
      .send({ email: 'not-an-email', password: 'short' })
      .expect(400);

    assert.equal(response.body.error.code, 'VALIDATION_ERROR');
    assert.ok(Array.isArray(response.body.error.details));
  });
});
