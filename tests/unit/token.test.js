const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

require('../helpers/testEnv');

const { generateRefreshToken, hashToken, getRefreshExpiresAt } = require('../../src/utils/token');

describe('token utilities', () => {
  it('generates unique refresh tokens', () => {
    const a = generateRefreshToken();
    const b = generateRefreshToken();
    assert.notEqual(a, b);
    assert.ok(a.length >= 32);
  });

  it('hashes tokens consistently', () => {
    const token = 'test-token-value';
    assert.equal(hashToken(token), hashToken(token));
    assert.notEqual(hashToken(token), hashToken('other-token'));
  });

  it('returns a future expiry date', () => {
    const expires = getRefreshExpiresAt();
    const diffMs = expires.getTime() - Date.now();
    assert.ok(diffMs > 0);
    assert.ok(diffMs <= 8 * 24 * 60 * 60 * 1000);
  });
});
