const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { ensureTestEnvironment, resetTestData } = require('../helpers/setup');
const { api, loginAs, authHeader } = require('../helpers/request');
const { SEED_USERS } = require('../helpers/constants');

describe('Maker-Approver workflow', { skip: process.env.SKIP_DB_TESTS === 'true' }, () => {
  let pool;
  let dbAvailable;

  before(async () => {
    const env = await ensureTestEnvironment();
    dbAvailable = env.available;
    pool = env.pool;
  });

  beforeEach(async () => {
    if (!dbAvailable) return;
    await resetTestData();
  });

  it('creates user only after approver approval', async (t) => {
    if (!dbAvailable) {
      t.skip('MySQL is not available');
      return;
    }

    const maker = await loginAs('maker');
    const approver = await loginAs('approver');
    const newEmail = 'approved-user@example.com';

    const createResponse = await api()
      .post('/api/v1/users')
      .set(authHeader(maker.token))
      .send({
        email: newEmail,
        password: 'Password123!',
        firstName: 'Approved',
        lastName: 'User',
      })
      .expect(202);

    const requestId = createResponse.body.data.approvalRequest.id;

    const [pendingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ? AND deleted_at IS NULL',
      [newEmail]
    );
    assert.equal(pendingUsers.length, 0);

    const approveResponse = await api()
      .post(`/api/v1/approvals/${requestId}/approve`)
      .set(authHeader(approver.token))
      .send({ comment: 'Looks good' })
      .expect(200);

    assert.equal(approveResponse.body.data.executed, true);
    assert.equal(approveResponse.body.data.approvalRequest.status, 'executed');

    const [createdUsers] = await pool.execute(
      'SELECT id, email FROM users WHERE email = ? AND deleted_at IS NULL',
      [newEmail]
    );
    assert.equal(createdUsers.length, 1);
    assert.equal(createdUsers[0].email, newEmail);
  });

  it('prevents requester from approving own request', async (t) => {
    if (!dbAvailable) {
      t.skip('MySQL is not available');
      return;
    }

    // Admin has both users:create and approvals:approve so the request reaches
    // the self-approval guard (Maker lacks approvals:approve and would fail at RBAC).
    const admin = await loginAs('admin');

    const createResponse = await api()
      .post('/api/v1/users')
      .set(authHeader(admin.token))
      .send({
        email: 'self-approve@example.com',
        password: 'Password123!',
        firstName: 'Self',
        lastName: 'Approve',
      })
      .expect(202);

    const requestId = createResponse.body.data.approvalRequest.id;

    const response = await api()
      .post(`/api/v1/approvals/${requestId}/approve`)
      .set(authHeader(admin.token))
      .send({ comment: 'Self approval attempt' })
      .expect(403);

    assert.equal(response.body.error.message, 'You cannot approve your own request');
  });

  it('rejects request without creating user', async (t) => {
    if (!dbAvailable) {
      t.skip('MySQL is not available');
      return;
    }

    const maker = await loginAs('maker');
    const approver = await loginAs('approver');
    const newEmail = 'rejected-user@example.com';

    const createResponse = await api()
      .post('/api/v1/users')
      .set(authHeader(maker.token))
      .send({
        email: newEmail,
        password: 'Password123!',
        firstName: 'Rejected',
        lastName: 'User',
      })
      .expect(202);

    const requestId = createResponse.body.data.approvalRequest.id;

    const rejectResponse = await api()
      .post(`/api/v1/approvals/${requestId}/reject`)
      .set(authHeader(approver.token))
      .send({ reason: 'Invalid department code' })
      .expect(200);

    assert.equal(rejectResponse.body.data.approvalRequest.status, 'rejected');

    const [users] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [newEmail]
    );
    assert.equal(users.length, 0);
  });

  it('executes password reset immediately without approval', async (t) => {
    if (!dbAvailable) {
      t.skip('MySQL is not available');
      return;
    }

    const maker = await loginAs('maker');

    // Use approver as target — not the shared "user" seed account used by other tests.
    const response = await api()
      .post(`/api/v1/users/${SEED_USERS.approver.id}/reset-password`)
      .set(authHeader(maker.token))
      .send({ newPassword: 'NewPassword123!' })
      .expect(200);

    assert.equal(response.body.data.requiresApproval, false);
    assert.equal(response.body.data.result.passwordReset, true);

    const [pendingApprovals] = await pool.execute(
      "SELECT id FROM approval_requests WHERE action_type = 'users:reset_password' AND status = 'pending'"
    );
    assert.equal(pendingApprovals.length, 0);
  });

  it('records audit trail for approval lifecycle', async (t) => {
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
        email: 'audit-trail@example.com',
        password: 'Password123!',
        firstName: 'Audit',
        lastName: 'Trail',
      })
      .expect(202);

    const requestId = createResponse.body.data.approvalRequest.id;

    await api()
      .post(`/api/v1/approvals/${requestId}/approve`)
      .set(authHeader(approver.token))
      .send({ comment: 'Approved for audit test' })
      .expect(200);

    const [logs] = await pool.execute(
      `SELECT action FROM audit_logs
       WHERE entity_type = 'approval_request' AND entity_id = ?
       ORDER BY created_at ASC`,
      [requestId]
    );

    const actions = logs.map((l) => l.action);
    assert.ok(actions.includes('approval.request_created'));
    assert.ok(actions.includes('approval.approved'));
    assert.ok(actions.includes('approval.executed'));
  });
});
