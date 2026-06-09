const rateLimit = require('express-rate-limit');
const config = require('../config');

const authRateLimiter = rateLimit({
  windowMs: config.rateLimit.authWindowMs,
  max: config.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'TOO_MANY_REQUESTS', message: 'Too many authentication attempts, please try again later' },
  },
});

module.exports = { authRateLimiter };
