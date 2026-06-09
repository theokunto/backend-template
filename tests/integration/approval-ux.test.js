const { describe, it, before, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { ensureTestEnvironment, resetTestData } = require('../helpers/setup');
const { api, loginAs, authHeader } = require('../helpers/request');
const { SEED_USERS, SEED_PASSWORD } = require('../helpers/constants');

describe('Approval UX enhancements', { skip: process.env.SKIP_DB_TESTS === 'true' }, () => {
  let dbAvailable;

  before(async () => {
    const env = await ensureTestEnvironment();
    dbAvailable = env.available;
  });

  beforeEach(async () => {
    if (!dbAvailable) return;
    await resetTestData();
  });

  it('filters approvals by requestedBy and actionType', async (t) => {
    if (!dbAvailable) {
      t.skip('MySQL is not available');
      return;
    }

    const maker = await loginAs('maker');
    const approver = await loginAs('approver');

    await api()
      .post('/api/v1/users')
      .set(authHeader(maker.token))
      .send({
        email: 'filter-test@example.com',
        password: SEED_PASSWORD,
        firstName: 'Filter',
        lastName: 'Test',
      })
      .expect(202);

    const response = await api()
      .get('/api/v1/approvals')
      .query({
        status: 'pending',
        actionType: 'users:create',
        requestedBy: SEED_USERS.maker.id,
      })
      .set(authHeader(approver.token))
      .expect(200);

    assert.ok(response.body.data.length >= 1);
    assert.ok(response.body.meta.total >= 1);
    assert.equal(response.body.data[0].actionType, 'users:create');
    assert.equal(response.body.data[0].requestedBy, SEED_USERS.maker.id);
  });

  it('allows maker to cancel own pending request', async (t) => {
    if (!dbAvailable) {
      t.skip('MySQL is not available');
      return;
    }

    const maker = await loginAs('maker');

    const createResponse = await api()
      .post('/api/v1/users')
      .set(authHeader(maker.token))
      .send({
        email: 'cancel-me@example.com',
        password: SEED_PASSWORD,
        firstName: 'Cancel',
        lastName: 'Me',
      })
      .expect(202);

    const requestId = createResponse.body.data.approvalRequest.id;

    const cancelResponse = await api()
      .post(`/api/v1/approvals/${requestId}/cancel`)
      .set(authHeader(maker.token))
      .expect(200);

    assert.equal(cancelResponse.body.data.approvalRequest.status, 'cancelled');
  });

  it('prevents approver from cancelling maker request', async (t) => {
    if (!dbAvailable) {
      t.skip('MySQL is not available');
      return;
    }

    const maker = await loginAs('maker');
    const approver = await loginAs('approver');

    const createResponse = await api()
      .post('/api/v1/users')
      .set(authHeader(maker.token))
      .send({
        email: 'no-cancel@example.com',
        password: SEED_PASSWORD,
        firstName: 'No',
        lastName: 'Cancel',
      })
      .expect(202);

    const requestId = createResponse.body.data.approvalRequest.id;

    const response = await api()
      .post(`/api/v1/approvals/${requestId}/cancel`)
      .set(authHeader(approver.token))
      .expect(403);

    assert.equal(response.body.error.code, 'FORBIDDEN');
  });
});
