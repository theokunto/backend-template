const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const SEED_PASSWORD = 'Password123!';

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'rbac_db',
    multipleStatements: true,
  });

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 12);

  const seedsPath = path.join(__dirname, '..', 'database', 'seeds.sql');
  let seeds = fs.readFileSync(seedsPath, 'utf8');

  seeds = seeds.replace(
    /\$2a\$12\$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8\/X4\.VTtYGKqJZqKqKq/g,
    passwordHash
  );

  console.log('Running seed data...');
  await connection.query(seeds);
  console.log('Seed completed.');
  console.log(`\nSeed users (password: ${SEED_PASSWORD}):`);
  console.log('  admin@example.com    → Admin');
  console.log('  maker@example.com    → Maker');
  console.log('  approver@example.com → Approver');
  console.log('  user@example.com     → User');

  await connection.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
