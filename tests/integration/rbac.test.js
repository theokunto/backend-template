const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { ensureTestEnvironment, resetTestData } = require('../helpers/setup');
const { api, loginAs, authHeader } = require('../helpers/request');

describe('RBAC authorization', { skip: process.env.SKIP_DB_TESTS === 'true' }, () => {
  let dbAvailable;

  before(async () => {
    const env = await ensureTestEnvironment();
    dbAvailable = env.available;
  });

  beforeEach(async () => {
    if (!dbAvailable) return;
    await resetTestData();
  });

  it('denies user role from creating users', async (t) => {
    if (!dbAvailable) {
      t.skip('MySQL is not available');
      return;
    }

    const { token } = await loginAs('user');

    const response = await api()
      .post('/api/v1/users')
      .set(authHeader(token))
      .send({
        email: 'blocked@example.com',
        password: 'Password123!',
        firstName: 'Blocked',
        lastName: 'User',
      })
      .expect(403);

    assert.equal(response.body.error.code, 'FORBIDDEN');
  });

  it('allows maker to submit user creation for approval', async (t) => {
    if (!dbAvailable) {
      t.skip('MySQL is not available');
      return;
    }

    const { token } = await loginAs('maker');

    const response = await api()
      .post('/api/v1/users')
      .set(authHeader(token))
      .send({
        email: 'newmaker@example.com',
        password: 'Password123!',
        firstName: 'New',
        lastName: 'Maker',
      })
      .expect(202);

    assert.equal(response.body.data.requiresApproval, true);
    assert.equal(response.body.data.approvalRequest.status, 'pending');
  });

  it('denies approver from creating users directly', async (t) => {
    if (!dbAvailable) {
      t.skip('MySQL is not available');
      return;
    }

    const { token } = await loginAs('approver');

    const response = await api()
      .post('/api/v1/users')
      .set(authHeader(token))
      .send({
        email: 'approvercreate@example.com',
        password: 'Password123!',
        firstName: 'No',
        lastName: 'Create',
      })
      .expect(403);

    assert.equal(response.body.error.code, 'FORBIDDEN');
  });

  it('allows user role to list users with read permission', async (t) => {
    if (!dbAvailable) {
      t.skip('MySQL is not available');
      return;
    }

    const { token } = await loginAs('user');

    const response = await api()
      .get('/api/v1/users')
      .set(authHeader(token))
      .expect(200);

    assert.equal(response.body.success, true);
    assert.ok(Array.isArray(response.body.data));
  });
});
