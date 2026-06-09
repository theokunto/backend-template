const { pool } = require('../config/database');

async function create({ entityType, entityId, action, actorId, details, ipAddress }, connection = pool) {
  await connection.execute(
    `INSERT INTO audit_logs (entity_type, entity_id, action, actor_id, details, ip_address)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      entityType,
      entityId || null,
      action,
      actorId || null,
      details ? JSON.stringify(details) : null,
      ipAddress || null,
    ]
  );
}

async function findAll({ entityType, entityId, actorId, page = 1, limit = 50 } = {}) {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];

  if (entityType) {
    conditions.push('entity_type = ?');
    params.push(entityType);
  }
  if (entityId) {
    conditions.push('entity_id = ?');
    params.push(entityId);
  }
  if (actorId) {
    conditions.push('actor_id = ?');
    params.push(actorId);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(String(limit), String(offset));

  const [rows] = await pool.execute(
    `SELECT id, entity_type, entity_id, action, actor_id, details, ip_address, created_at
     FROM audit_logs ${where}
     ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    params
  );

  return { data: rows, page, limit };
}

module.exports = { create, findAll };
