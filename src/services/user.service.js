const userRepository = require('../repositories/user.repository');
const approvalService = require('./approval.service');
const { ACTION_TYPES } = require('../constants/permissions');
const { NotFoundError, ConflictError } = require('../utils/errors');

async function listUsers(filters) {
  const result = await userRepository.findAll(filters);
  return {
    ...result,
    data: result.data.map(formatUser),
  };
}

async function getUser(id) {
  const user = await userRepository.findById(id);
  if (!user) throw new NotFoundError('User not found');
  const { roles } = await userRepository.getRolesAndPermissions(id);
  return { ...formatUser(user), roles };
}

async function createUser({ actorId, ipAddress, ...data }) {
  const existing = await userRepository.findByEmail(data.email);
  if (existing) {
    throw new ConflictError('Email already in use');
  }

  return approvalService.submitAction({
    actionType: ACTION_TYPES.USERS_CREATE,
    payload: data,
    requestedBy: actorId,
    ipAddress,
  });
}

async function updateUser({ userId, actorId, ipAddress, ...data }) {
  const user = await userRepository.findById(userId);
  if (!user) throw new NotFoundError('User not found');

  return approvalService.submitAction({
    actionType: ACTION_TYPES.USERS_UPDATE,
    payload: { userId, ...data },
    requestedBy: actorId,
    entityId: userId,
    ipAddress,
  });
}

async function deleteUser({ userId, actorId, ipAddress }) {
  const user = await userRepository.findById(userId);
  if (!user) throw new NotFoundError('User not found');

  return approvalService.submitAction({
    actionType: ACTION_TYPES.USERS_DELETE,
    payload: { userId },
    requestedBy: actorId,
    entityId: userId,
    ipAddress,
  });
}

async function activateUser({ userId, actorId, ipAddress }) {
  const user = await userRepository.findById(userId);
  if (!user) throw new NotFoundError('User not found');

  return approvalService.submitAction({
    actionType: ACTION_TYPES.USERS_ACTIVATE,
    payload: { userId },
    requestedBy: actorId,
    entityId: userId,
    ipAddress,
  });
}

async function deactivateUser({ userId, actorId, ipAddress }) {
  const user = await userRepository.findById(userId);
  if (!user) throw new NotFoundError('User not found');

  return approvalService.submitAction({
    actionType: ACTION_TYPES.USERS_DEACTIVATE,
    payload: { userId },
    requestedBy: actorId,
    entityId: userId,
    ipAddress,
  });
}

async function resetPassword({ userId, actorId, ipAddress, newPassword }) {
  const user = await userRepository.findById(userId);
  if (!user) throw new NotFoundError('User not found');

  return approvalService.submitAction({
    actionType: ACTION_TYPES.USERS_RESET_PASSWORD,
    payload: { userId, newPassword },
    requestedBy: actorId,
    entityId: userId,
    ipAddress,
  });
}

function formatUser(user) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    isActive: !!user.is_active,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
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
