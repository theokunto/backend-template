const { describe, it, before, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { ensureTestEnvironment, resetTestData } = require('../helpers/setup');
const { api, loginAs, authHeader } = require('../helpers/request');

describe('Approval configuration admin API', { skip: process.env.SKIP_DB_TESTS === 'true' }, () => {
  let dbAvailable;

  before(async () => {
    const env = await ensureTestEnvironment();
    dbAvailable = env.available;
  });

  beforeEach(async () => {
    if (!dbAvailable) return;
    await resetTestData();
  });

  it('admin can list approval configurations', async (t) => {
    if (!dbAvailable) {
      t.skip('MySQL is not available');
      return;
    }

    const { token } = await loginAs('admin');
    const response = await api()
      .get('/api/v1/approval-configurations')
      .set(authHeader(token))
      .expect(200);

    assert.ok(response.body.data.length >= 6);
    assert.ok(response.body.data.some((c) => c.actionType === 'users:create'));
  });

  it('admin can update approval configuration', async (t) => {
    if (!dbAvailable) {
      t.skip('MySQL is not available');
      return;
    }

    const { token } = await loginAs('admin');
    const actionType = encodeURIComponent('users:reset_password');

    const response = await api()
      .patch(`/api/v1/approval-configurations/${actionType}`)
      .set(authHeader(token))
      .send({ requiresApproval: true, description: 'Now requires approval' })
      .expect(200);

    assert.equal(response.body.data.requiresApproval, true);

    await api()
      .patch(`/api/v1/approval-configurations/${actionType}`)
      .set(authHeader(token))
      .send({ requiresApproval: false, description: 'Password reset does not require approval' })
      .expect(200);
  });

  it('denies maker from updating approval configuration', async (t) => {
    if (!dbAvailable) {
      t.skip('MySQL is not available');
      return;
    }

    const { token } = await loginAs('maker');
    const actionType = encodeURIComponent('users:create');

    await api()
      .patch(`/api/v1/approval-configurations/${actionType}`)
      .set(authHeader(token))
      .send({ requiresApproval: false })
      .expect(403);
  });
});
