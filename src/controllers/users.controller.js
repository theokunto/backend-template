const userService = require('../services/user.service');

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
}

async function listUsers(req, res, next) {
  try {
    const result = await userService.listUsers(req.query);
    res.json({ success: true, data: result.data, meta: { total: result.total, page: result.page, limit: result.limit } });
  } catch (error) {
    next(error);
  }
}

async function getUser(req, res, next) {
  try {
    const user = await userService.getUser(req.params.id);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

async function createUser(req, res, next) {
  try {
    const result = await userService.createUser({
      ...req.body,
      actorId: req.user.id,
      ipAddress: getClientIp(req),
    });

    const status = result.requiresApproval ? 202 : 201;
    res.status(status).json({
      success: true,
      data: result,
      message: result.requiresApproval
        ? 'User creation request submitted for approval'
        : 'User created successfully',
    });
  } catch (error) {
    next(error);
  }
}

async function updateUser(req, res, next) {
  try {
    const result = await userService.updateUser({
      userId: req.params.id,
      ...req.body,
      actorId: req.user.id,
      ipAddress: getClientIp(req),
    });

    res.status(result.requiresApproval ? 202 : 200).json({
      success: true,
      data: result,
      message: result.requiresApproval
        ? 'User update request submitted for approval'
        : 'User updated successfully',
    });
  } catch (error) {
    next(error);
  }
}

async function deleteUser(req, res, next) {
  try {
    const result = await userService.deleteUser({
      userId: req.params.id,
      actorId: req.user.id,
      ipAddress: getClientIp(req),
    });

    res.status(result.requiresApproval ? 202 : 200).json({
      success: true,
      data: result,
      message: result.requiresApproval
        ? 'User deletion request submitted for approval'
        : 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

async function activateUser(req, res, next) {
  try {
    const result = await userService.activateUser({
      userId: req.params.id,
      actorId: req.user.id,
      ipAddress: getClientIp(req),
    });

    res.status(result.requiresApproval ? 202 : 200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function deactivateUser(req, res, next) {
  try {
    const result = await userService.deactivateUser({
      userId: req.params.id,
      actorId: req.user.id,
      ipAddress: getClientIp(req),
    });

    res.status(result.requiresApproval ? 202 : 200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    const result = await userService.resetPassword({
      userId: req.params.id,
      newPassword: req.body.newPassword,
      actorId: req.user.id,
      ipAddress: getClientIp(req),
    });

    res.status(result.requiresApproval ? 202 : 200).json({
      success: true,
      data: result,
      message: result.requiresApproval
        ? 'Password reset request submitted for approval'
        : 'Password reset successfully',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  activateUser,
  deactivateUser,
  resetPassword,
};
