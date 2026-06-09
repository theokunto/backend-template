require('dotenv').config();
const { pool } = require('../src/config/database');
const refreshTokenRepository = require('../src/repositories/refreshToken.repository');
const logger = require('../src/utils/logger');

async function cleanup() {
  const deletedCount = await refreshTokenRepository.deleteExpired();
  logger.info({ deletedCount }, 'Expired refresh tokens cleaned up');
  await pool.end();
}

cleanup().catch((err) => {
  logger.error({ err }, 'Token cleanup failed');
  process.exit(1);
});
