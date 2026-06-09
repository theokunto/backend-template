const authService = require('../services/auth.service');

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
}

async function login(req, res, next) {
  try {
    const result = await authService.login({
      email: req.body.email,
      password: req.body.password,
      ipAddress: getClientIp(req),
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function refresh(req, res, next) {
  try {
    const result = await authService.refresh({
      refreshToken: req.body.refreshToken,
      ipAddress: getClientIp(req),
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    const result = await authService.logout({
      refreshToken: req.body.refreshToken,
      ipAddress: getClientIp(req),
    });
    res.json({ success: true, data: result, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
}

async function logoutAll(req, res, next) {
  try {
    const result = await authService.logoutAll({
      userId: req.user.id,
      ipAddress: getClientIp(req),
    });
    res.json({ success: true, data: result, message: 'All sessions cleared' });
  } catch (error) {
    next(error);
  }
}

async function getProfile(req, res, next) {
  try {
    const profile = await authService.getProfile(req.user.id);
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
}

module.exports = { login, refresh, logout, logoutAll, getProfile };
