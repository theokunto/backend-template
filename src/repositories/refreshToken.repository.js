const { pool } = require('../config/database');

async function create({ id, userId, tokenHash, familyId, expiresAt }, connection = pool) {
  await connection.execute(
    `INSERT INTO refresh_tokens (id, user_id, token_hash, family_id, expires_at)
     VALUES (?, ?, ?, ?, ?)`,
    [id, userId, tokenHash, familyId, expiresAt]
  );
}

async function findByTokenHash(tokenHash, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT id, user_id, token_hash, family_id, expires_at, revoked_at, replaced_by, created_at
     FROM refresh_tokens WHERE token_hash = ?`,
    [tokenHash]
  );
  return rows[0] || null;
}

async function revokeById(id, replacedBy = null, connection = pool) {
  await connection.execute(
    `UPDATE refresh_tokens
     SET revoked_at = CURRENT_TIMESTAMP, replaced_by = ?
     WHERE id = ? AND revoked_at IS NULL`,
    [replacedBy, id]
  );
}

async function revokeAllForUser(userId, connection = pool) {
  await connection.execute(
    `UPDATE refresh_tokens
     SET revoked_at = CURRENT_TIMESTAMP
     WHERE user_id = ? AND revoked_at IS NULL`,
    [userId]
  );
}

async function revokeFamily(familyId, connection = pool) {
  await connection.execute(
    `UPDATE refresh_tokens
     SET revoked_at = CURRENT_TIMESTAMP
     WHERE family_id = ? AND revoked_at IS NULL`,
    [familyId]
  );
}

async function deleteExpired(connection = pool) {
  const [result] = await connection.execute(
    `DELETE FROM refresh_tokens
     WHERE expires_at < NOW()
        OR (revoked_at IS NOT NULL AND revoked_at < DATE_SUB(NOW(), INTERVAL 30 DAY))`
  );
  return result.affectedRows;
}

module.exports = {
  create,
  findByTokenHash,
  revokeById,
  revokeAllForUser,
  revokeFamily,
  deleteExpired,
};
