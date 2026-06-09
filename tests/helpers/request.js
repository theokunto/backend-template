const supertest = require('supertest');
const { SEED_PASSWORD, SEED_USERS } = require('./constants');

let app;
let pool;

function initTestApp() {
  require('./testEnv');
  app = require('../../src/app');
  pool = require('../../src/config/database').pool;
  return { app, pool };
}

function api() {
  if (!app) {
    throw new Error('Call initTestApp() before making requests');
  }
  return supertest(app);
}

async function loginAs(role) {
  const user = SEED_USERS[role];
  const response = await api()
    .post('/api/v1/auth/login')
    .send({ email: user.email, password: SEED_PASSWORD })
    .expect(200);

  return {
    token: response.body.data.accessToken,
    refreshToken: response.body.data.refreshToken,
    user: response.body.data.user,
  };
}

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

module.exports = { initTestApp, api, loginAs, authHeader };
