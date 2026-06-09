const jwt = require('jsonwebtoken');
const config = require('../config');

function signAccessToken(payload) {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
    issuer: 'rbac-backend',
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, config.jwt.secret, { issuer: 'rbac-backend' });
}

module.exports = { signAccessToken, verifyAccessToken };
