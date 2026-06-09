const { describe, it, before, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { ensureTestEnvironment, resetTestData } = require('../helpers/setup');
const { api, loginAs, authHeader } = require('../helpers/request');
const { SEED_USERS, SEED_PASSWORD } = require('../helpers/constants');

describe('Authentication', { skip: process.env.SKIP_DB_TESTS === 'true' }, () => {
  let dbAvailable;

  before(async () => {
    const env = await ensureTestEnvironment();
    dbAvailable = env.available;
  });

  beforeEach(async () => {
    if (!dbAvailable) return;
    await resetTestData();
  });

  it('logs in with valid credentials and returns token pair', async (t) => {
    if (!dbAvailable) {
      t.skip('MySQL is not available');
      return;
    }

    const response = await api()
      .post('/api/v1/auth/login')
      .send({ email: SEED_USERS.maker.email, password: SEED_PASSWORD })
      .expect(200);

    assert.equal(response.body.success, true);
    assert.ok(response.body.data.accessToken);
    assert.ok(response.body.data.refreshToken);
    assert.equal(response.body.data.user.email, SEED_USERS.maker.email);
    assert.ok(response.body.data.user.permissions.includes('users:create'));
  });

  it('rejects invalid credentials', async (t) => {
    if (!dbAvailable) {
      t.skip('MySQL is not available');
      return;
    }

    const response = await api()
      .post('/api/v1/auth/login')
      .send({ email: SEED_USERS.maker.email, password: 'wrong-password' })
      .expect(401);

    assert.equal(response.body.success, false);
    assert.equal(response.body.error.code, 'UNAUTHORIZED');
  });

  it('returns profile for authenticated user', async (t) => {
    if (!dbAvailable) {
      t.skip('MySQL is not available');
      return;
    }

    const { token } = await loginAs('approver');

    const response = await api()
      .get('/api/v1/auth/me')
      .set(authHeader(token))
      .expect(200);

    assert.equal(response.body.data.email, SEED_USERS.approver.email);
    assert.ok(response.body.data.permissions.includes('approvals:approve'));
  });

  it('rejects unauthenticated profile request', async (t) => {
    if (!dbAvailable) {
      t.skip('MySQL is not available');
      return;
    }

    const response = await api().get('/api/v1/auth/me').expect(401);
    assert.equal(response.body.error.code, 'UNAUTHORIZED');
  });

  it('refreshes access token and rotates refresh token', async (t) => {
    if (!dbAvailable) {
      t.skip('MySQL is not available');
      return;
    }

    const login = await loginAs('maker');
    const oldRefreshToken = login.refreshToken;

    const refreshResponse = await api()
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: oldRefreshToken })
      .expect(200);

    assert.ok(refreshResponse.body.data.accessToken);
    assert.ok(refreshResponse.body.data.refreshToken);
    assert.notEqual(refreshResponse.body.data.refreshToken, oldRefreshToken);

    await api()
      .get('/api/v1/auth/me')
      .set(authHeader(refreshResponse.body.data.accessToken))
      .expect(200);
  });

  it('rejects reuse of a rotated refresh token', async (t) => {
    if (!dbAvailable) {
      t.skip('MySQL is not available');
      return;
    }

    const login = await loginAs('maker');
    const oldRefreshToken = login.refreshToken;

    await api()
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: oldRefreshToken })
      .expect(200);

    const response = await api()
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: oldRefreshToken })
      .expect(401);

    assert.equal(response.body.error.code, 'UNAUTHORIZED');
  });

  it('logs out and invalidates refresh token', async (t) => {
    if (!dbAvailable) {
      t.skip('MySQL is not available');
      return;
    }

    const login = await loginAs('maker');

    await api()
      .post('/api/v1/auth/logout')
      .send({ refreshToken: login.refreshToken })
      .expect(200);

    const response = await api()
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: login.refreshToken })
      .expect(401);

    assert.equal(response.body.error.code, 'UNAUTHORIZED');
  });

  it('clears all sessions with logout-all', async (t) => {
    if (!dbAvailable) {
      t.skip('MySQL is not available');
      return;
    }

    const session1 = await loginAs('admin');
    const session2 = await api()
      .post('/api/v1/auth/login')
      .send({ email: SEED_USERS.admin.email, password: SEED_PASSWORD })
      .expect(200);

    const refreshToken2 = session2.body.data.refreshToken;

    await api()
      .post('/api/v1/auth/logout-all')
      .set(authHeader(session1.token))
      .expect(200);

    await api()
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: session1.refreshToken })
      .expect(401);

    await api()
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: refreshToken2 })
      .expect(401);
  });

  it('rejects invalid refresh token', async (t) => {
    if (!dbAvailable) {
      t.skip('MySQL is not available');
      return;
    }

    const response = await api()
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'not-a-valid-token' })
      .expect(401);

    assert.equal(response.body.error.code, 'UNAUTHORIZED');
  });
});
