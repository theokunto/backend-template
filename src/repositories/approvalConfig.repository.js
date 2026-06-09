const { pool } = require('../config/database');

async function findAll({ includeInactive = false } = {}) {
  let sql = `SELECT id, action_type, requires_approval, min_approvers, is_active, description,
                    created_at, updated_at
             FROM approval_configurations`;
  if (!includeInactive) {
    sql += ' WHERE is_active = 1';
  }
  sql += ' ORDER BY action_type ASC';

  const [rows] = await pool.execute(sql);
  return rows;
}

async function findByActionType(actionType, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT id, action_type, requires_approval, min_approvers, is_active, description,
            created_at, updated_at
     FROM approval_configurations WHERE action_type = ?`,
    [actionType]
  );
  return rows[0] || null;
}

async function update(actionType, fields, connection = pool) {
  const sets = [];
  const values = [];
  const allowed = {
    requiresApproval: 'requires_approval',
    minApprovers: 'min_approvers',
    isActive: 'is_active',
    description: 'description',
  };

  for (const [key, col] of Object.entries(allowed)) {
    if (fields[key] !== undefined) {
      sets.push(`${col} = ?`);
      values.push(fields[key]);
    }
  }

  if (sets.length === 0) return findByActionType(actionType, connection);

  values.push(actionType);
  await connection.execute(
    `UPDATE approval_configurations SET ${sets.join(', ')} WHERE action_type = ?`,
    values
  );
  return findByActionType(actionType, connection);
}

module.exports = { findAll, findByActionType, update };
