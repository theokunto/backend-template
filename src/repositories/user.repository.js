const { pool } = require('../config/database');

async function findByEmail(email) {
  const [rows] = await pool.execute(
    `SELECT id, email, password_hash, first_name, last_name, is_active, created_at, updated_at
     FROM users WHERE email = ? AND deleted_at IS NULL`,
    [email]
  );
  return rows[0] || null;
}

async function findById(id, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT id, email, first_name, last_name, is_active, created_at, updated_at
     FROM users WHERE id = ? AND deleted_at IS NULL`,
    [id]
  );
  return rows[0] || null;
}

async function findAll({ page = 1, limit = 20 } = {}) {
  const offset = (page - 1) * limit;
  const [rows] = await pool.execute(
    `SELECT id, email, first_name, last_name, is_active, created_at, updated_at
     FROM users WHERE deleted_at IS NULL
     ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [String(limit), String(offset)]
  );
  const [[{ total }]] = await pool.execute(
    'SELECT COUNT(*) AS total FROM users WHERE deleted_at IS NULL'
  );
  return { data: rows, total, page, limit };
}

async function create(user, connection = pool) {
  await connection.execute(
    `INSERT INTO users (id, email, password_hash, first_name, last_name, is_active)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [user.id, user.email, user.passwordHash, user.firstName, user.lastName, user.isActive ?? 1]
  );
  return findById(user.id, connection);
}

async function update(id, fields, connection = pool) {
  const sets = [];
  const values = [];
  const allowed = ['email', 'first_name', 'last_name', 'password_hash', 'is_active'];

  for (const [key, value] of Object.entries(fields)) {
    const col = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    if (allowed.includes(col)) {
      sets.push(`${col} = ?`);
      values.push(value);
    }
  }

  if (sets.length === 0) return findById(id, connection);

  values.push(id);
  await connection.execute(
    `UPDATE users SET ${sets.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
    values
  );
  return findById(id, connection);
}

async function softDelete(id, connection = pool) {
  await connection.execute(
    'UPDATE users SET deleted_at = CURRENT_TIMESTAMP, is_active = 0 WHERE id = ?',
    [id]
  );
}

async function getRolesAndPermissions(userId) {
  const [roles] = await pool.execute(
    `SELECT r.id, r.name FROM roles r
     INNER JOIN user_roles ur ON ur.role_id = r.id
     WHERE ur.user_id = ?`,
    [userId]
  );

  const [permissions] = await pool.execute(
    `SELECT DISTINCT p.name FROM permissions p
     INNER JOIN role_permissions rp ON rp.permission_id = p.id
     INNER JOIN user_roles ur ON ur.role_id = rp.role_id
     WHERE ur.user_id = ?`,
    [userId]
  );

  return {
    roles: roles.map((r) => r.name),
    permissions: permissions.map((p) => p.name),
  };
}

module.exports = {
  findByEmail,
  findById,
  findAll,
  create,
  update,
  softDelete,
  getRolesAndPermissions,
};
