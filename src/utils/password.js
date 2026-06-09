const bcrypt = require('bcryptjs');
const config = require('../config');

async function hashPassword(plain) {
  return bcrypt.hash(plain, config.bcryptRounds);
}

async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

module.exports = { hashPassword, comparePassword };
