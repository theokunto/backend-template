const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { SEED_PASSWORD, SEED_USER_IDS } = require('./constants');

function getDbConfig() {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'rbac_db_test',
  };
}

async function migrateAndSeed() {
  const dbName = getDbConfig().database;
  const rootConnection = await mysql.createConnection({
    host: getDbConfig().host,
    port: getDbConfig().port,
    user: getDbConfig().user,
    password: getDbConfig().password,
    multipleStatements: true,
  });

  const schemaPath = path.join(__dirname, '../../database/schema.sql');
  let schema = fs.readFileSync(schemaPath, 'utf8');
  schema = schema.replace(/rbac_db/g, dbName);
  await rootConnection.query(schema);

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 4);
  const seedsPath = path.join(__dirname, '../../database/seeds.sql');
  let seeds = fs.readFileSync(seedsPath, 'utf8');
  seeds = seeds.replace(/rbac_db/g, dbName);
  seeds = seeds.replace(
    /\$2a\$12\$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8\/X4\.VTtYGKqJZqKqKq/g,
    passwordHash
  );

  await rootConnection.query(seeds);
  await rootConnection.end();
}

async function restoreSeedUserPasswords(pool) {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 4);
  const placeholders = SEED_USER_IDS.map(() => '?').join(', ');

  await pool.query(
    `UPDATE users
     SET password_hash = ?, is_active = 1, deleted_at = NULL
     WHERE id IN (${placeholders})`,
    [passwordHash, ...SEED_USER_IDS]
  );
}

async function resetDatabase(pool) {
  const placeholders = SEED_USER_IDS.map(() => '?').join(', ');

  await pool.query('SET FOREIGN_KEY_CHECKS = 0');
  await pool.query('TRUNCATE TABLE audit_logs');
  await pool.query('TRUNCATE TABLE refresh_tokens');
  await pool.query('TRUNCATE TABLE approval_request_approvers');
  await pool.query('TRUNCATE TABLE approval_requests');
  await pool.query(`DELETE FROM user_roles WHERE user_id NOT IN (${placeholders})`, SEED_USER_IDS);
  await pool.query(`DELETE FROM users WHERE id NOT IN (${placeholders})`, SEED_USER_IDS);
  await pool.query('SET FOREIGN_KEY_CHECKS = 1');

  await restoreSeedUserPasswords(pool);
}

async function closePool(pool) {
  if (pool) {
    await pool.end();
  }
}

async function isDatabaseAvailable() {
  try {
    const connection = await mysql.createConnection({
      host: getDbConfig().host,
      port: getDbConfig().port,
      user: getDbConfig().user,
      password: getDbConfig().password,
    });
    await connection.ping();
    await connection.end();
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  getDbConfig,
  migrateAndSeed,
  resetDatabase,
  closePool,
  isDatabaseAvailable,
};
