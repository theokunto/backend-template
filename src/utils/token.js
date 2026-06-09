const crypto = require('crypto');
const config = require('../config');

function generateRefreshToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function getRefreshExpiresAt() {
  const expiresIn = config.jwt.refreshExpiresIn;
  const match = String(expiresIn).match(/^(\d+)([smhd])$/i);

  if (!match) {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  const value = parseInt(match[1], 10);
  const multipliers = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return new Date(Date.now() + value * multipliers[match[2].toLowerCase()]);
}

module.exports = { generateRefreshToken, hashToken, getRefreshExpiresAt };
