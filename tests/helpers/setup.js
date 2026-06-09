const {
  migrateAndSeed,
  resetDatabase,
  isDatabaseAvailable,
} = require('./database');
const { initTestApp } = require('./request');

let pool;
let ready;

async function ensureTestEnvironment() {
  if (!ready) {
    ready = (async () => {
      const available = await isDatabaseAvailable();
      if (!available) {
        return { available: false, pool: null };
      }

      await migrateAndSeed();
      ({ pool } = initTestApp());
      return { available: true, pool };
    })();
  }
  return ready;
}

async function resetTestData() {
  if (pool) {
    await resetDatabase(pool);
  }
}

async function closeTestEnvironment() {
  if (pool) {
    await pool.end();
    pool = null;
    ready = null;
  }
}

module.exports = { ensureTestEnvironment, resetTestData, closeTestEnvironment };
