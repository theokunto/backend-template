const { pool } = require('../config/database');

async function live(req, res) {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
}

async function ready(req, res) {
  try {
    await pool.execute('SELECT 1');
    res.json({
      success: true,
      status: 'ready',
      checks: { database: 'up' },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'not_ready',
      checks: { database: 'down' },
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}

module.exports = { live, ready };
