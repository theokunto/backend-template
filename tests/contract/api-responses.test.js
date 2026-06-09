const { describe, it, before, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { ensureTestEnvironment, resetTestData } = require('../helpers/setup');
const { api, loginAs } = require('../helpers/request');
const { SEED_USERS, SEED_PASSWORD } = require('../helpers/constants');
const {
  loginResponseSchema,
  refreshResponseSchema,
  approvalRequestSchema,
  approvalConfigSchema,
  errorResponseSchema,
} = require('./schemas');

describe('API response contracts', { skip: process.env.SKIP_DB_TESTS === 'true' }, () => {
  let dbAvailable;

  before(async () => {
    const env = await ensureTestEnvironment();
    dbAvailable = env.available;
  });

  beforeEach(async () => {
    if (!dbAvailable) return;
    await resetTestData();
  });

  it('login response matches contract', async (t) => {
    if (!dbAvailable) {
      t.skip('MySQL is not available');
      return;
    }

    const response = await api()
      .post('/api/v1/auth/login')
      .send({ email: SEED_USERS.maker.email, password: SEED_PASSWORD });

    const { error } = loginResponseSchema.validate(response.body);
    assert.equal(error, undefined, error?.message);
  });

  it('refresh response matches contract', async (t) => {
    if (!dbAvailable) {
      t.skip('MySQL is not available');
      return;
    }

    const login = await loginAs('maker');
    const response = await api()
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: login.refreshToken });

    const { error } = refreshResponseSchema.validate(response.body);
    assert.equal(error, undefined, error?.message);
  });

  it('approval request response matches contract', async (t) => {
    if (!dbAvailable) {
      t.skip('MySQL is not available');
      return;
    }

    const { token } = await loginAs('maker');
    const response = await api()
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 'contract@example.com',
        password: SEED_PASSWORD,
        firstName: 'Contract',
        lastName: 'Test',
      });

    const { error } = approvalRequestSchema.validate(response.body.data.approvalRequest);
    assert.equal(error, undefined, error?.message);
  });

  it('approval config response matches contract', async (t) => {
    if (!dbAvailable) {
      t.skip('MySQL is not available');
      return;
    }

    const { token } = await loginAs('admin');
    const actionType = encodeURIComponent('users:create');
    const response = await api()
      .get(`/api/v1/approval-configurations/${actionType}`)
      .set('Authorization', `Bearer ${token}`);

    const { error } = approvalConfigSchema.validate(response.body.data);
    assert.equal(error, undefined, error?.message);
  });

  it('error response matches contract', async (t) => {
    if (!dbAvailable) {
      t.skip('MySQL is not available');
      return;
    }

    const response = await api()
      .post('/api/v1/auth/login')
      .send({ email: SEED_USERS.maker.email, password: 'wrong-password' });

    const { error } = errorResponseSchema.validate(response.body);
    assert.equal(error, undefined, error?.message);
  });
});
