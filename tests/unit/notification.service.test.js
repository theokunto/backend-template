const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');

require('../helpers/testEnv');

const config = require('../../src/config');
const { notifyApprovalPending } = require('../../src/services/notification.service');

describe('notification service', () => {
  let originalUrl;
  let fetchCalls;

  before(() => {
    originalUrl = config.webhook.approvalUrl;
    fetchCalls = [];
    global.fetch = async (url, options) => {
      fetchCalls.push({ url, options });
      return { ok: true, status: 200 };
    };
  });

  after(() => {
    config.webhook.approvalUrl = originalUrl;
    delete global.fetch;
  });

  it('skips when webhook URL is not configured', async () => {
    config.webhook.approvalUrl = '';
    const result = await notifyApprovalPending({
      approvalRequest: { id: '1', actionType: 'users:create', entityType: 'user', status: 'pending', createdAt: new Date() },
      requestedBy: 'user-1',
    });
    assert.equal(result.sent, false);
    assert.equal(result.reason, 'webhook_not_configured');
  });

  it('posts payload when webhook URL is configured', async () => {
    config.webhook.approvalUrl = 'https://hooks.example.com/approvals';
    const result = await notifyApprovalPending({
      approvalRequest: {
        id: 'req-1',
        actionType: 'users:create',
        entityType: 'user',
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
      requestedBy: 'maker-1',
    });

    assert.equal(result.sent, true);
    assert.equal(fetchCalls.length, 1);
    assert.equal(fetchCalls[0].url, 'https://hooks.example.com/approvals');
    const body = JSON.parse(fetchCalls[0].options.body);
    assert.equal(body.event, 'approval.pending');
    assert.equal(body.data.approvalRequestId, 'req-1');
  });
});
