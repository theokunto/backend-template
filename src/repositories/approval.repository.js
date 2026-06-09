const { pool } = require('../config/database');

async function getConfig(actionType, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT id, action_type, requires_approval, min_approvers, is_active
     FROM approval_configurations
     WHERE action_type = ? AND is_active = 1`,
    [actionType]
  );
  return rows[0] || null;
}

async function createRequest(request, connection = pool) {
  await connection.execute(
    `INSERT INTO approval_requests
       (id, action_type, entity_type, entity_id, payload, status, requested_by, min_approvers)
     VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`,
    [
      request.id,
      request.actionType,
      request.entityType,
      request.entityId || null,
      JSON.stringify(request.payload),
      request.requestedBy,
      request.minApprovers ?? 1,
    ]
  );
  return findById(request.id, connection);
}

async function findById(id, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT id, action_type, entity_type, entity_id, payload, status,
            requested_by, approved_by, rejected_by, rejection_reason,
            approval_count, min_approvers, execution_error,
            created_at, updated_at, executed_at
     FROM approval_requests WHERE id = ?`,
    [id]
  );
  if (!rows[0]) return null;
  const row = rows[0];
  row.payload = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload;
  return row;
}

async function findAll({
  status,
  actionType,
  requestedBy,
  fromDate,
  toDate,
  page = 1,
  limit = 20,
} = {}) {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];

  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  if (actionType) {
    conditions.push('action_type = ?');
    params.push(actionType);
  }
  if (requestedBy) {
    conditions.push('requested_by = ?');
    params.push(requestedBy);
  }
  if (fromDate) {
    conditions.push('created_at >= ?');
    params.push(fromDate);
  }
  if (toDate) {
    conditions.push('created_at <= ?');
    params.push(toDate);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countSql = `SELECT COUNT(*) AS total FROM approval_requests ${where}`;
  const [[{ total }]] = await pool.execute(countSql, params);

  const sql = `SELECT id, action_type, entity_type, entity_id, status,
                      requested_by, approved_by, rejected_by,
                      approval_count, min_approvers, created_at, updated_at, executed_at
               FROM approval_requests ${where}
               ORDER BY created_at DESC LIMIT ? OFFSET ?`;

  const [rows] = await pool.execute(sql, [...params, String(limit), String(offset)]);
  return { data: rows, total, page, limit };
}

async function updateStatus(id, updates, connection = pool) {
  const fields = [];
  const values = [];

  const mapping = {
    status: 'status',
    approvedBy: 'approved_by',
    rejectedBy: 'rejected_by',
    rejectionReason: 'rejection_reason',
    approvalCount: 'approval_count',
    executionError: 'execution_error',
    executedAt: 'executed_at',
  };

  for (const [key, col] of Object.entries(mapping)) {
    if (updates[key] !== undefined) {
      fields.push(`${col} = ?`);
      values.push(updates[key]);
    }
  }

  if (fields.length === 0) return findById(id, connection);

  values.push(id);
  await connection.execute(
    `UPDATE approval_requests SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  return findById(id, connection);
}

async function recordApproverDecision({ id, approvalRequestId, approverId, decision, comment }, connection = pool) {
  await connection.execute(
    `INSERT INTO approval_request_approvers (id, approval_request_id, approver_id, decision, comment)
     VALUES (?, ?, ?, ?, ?)`,
    [id, approvalRequestId, approverId, decision, comment || null]
  );
}

async function hasApproverDecided(approvalRequestId, approverId, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT id FROM approval_request_approvers
     WHERE approval_request_id = ? AND approver_id = ?`,
    [approvalRequestId, approverId]
  );
  return rows.length > 0;
}

module.exports = {
  getConfig,
  createRequest,
  findById,
  findAll,
  updateStatus,
  recordApproverDecision,
  hasApproverDecided,
};
