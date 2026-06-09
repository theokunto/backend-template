const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const { ensureTestEnvironment } = require('../helpers/setup');
const { api } = require('../helpers/request');

describe('Health checks', { skip: process.env.SKIP_DB_TESTS === 'true' }, () => {
  let dbAvailable;

  before(async () => {
    const env = await ensureTestEnvironment();
    dbAvailable = env.available;
  });

  it('live endpoint returns ok', async (t) => {
    if (!dbAvailable) {
      t.skip('MySQL is not available');
      return;
    }

    const response = await api().get('/api/v1/health/live').expect(200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.status, 'ok');
  });

  it('ready endpoint checks database', async (t) => {
    if (!dbAvailable) {
      t.skip('MySQL is not available');
      return;
    }

    const response = await api().get('/api/v1/health/ready').expect(200);
    assert.equal(response.body.status, 'ready');
    assert.equal(response.body.checks.database, 'up');
  });
});
