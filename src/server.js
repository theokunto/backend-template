const app = require('./app');
const config = require('./config');
const { pool } = require('./config/database');
const logger = require('./utils/logger');

async function start() {
  try {
    await pool.execute('SELECT 1');
    logger.info('Database connection established');

    app.listen(config.port, () => {
      logger.info({ port: config.port, env: config.env }, 'RBAC API started');
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
}

start();
