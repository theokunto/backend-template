const PERMISSIONS = {
  USERS_CREATE: 'users:create',
  USERS_READ: 'users:read',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  USERS_ACTIVATE: 'users:activate',
  USERS_DEACTIVATE: 'users:deactivate',
  USERS_RESET_PASSWORD: 'users:reset_password',
  APPROVALS_READ: 'approvals:read',
  APPROVALS_APPROVE: 'approvals:approve',
  APPROVALS_REJECT: 'approvals:reject',
  APPROVALS_CANCEL: 'approvals:cancel',
  APPROVAL_CONFIG_READ: 'approval_config:read',
  APPROVAL_CONFIG_UPDATE: 'approval_config:update',
  AUDIT_READ: 'audit:read',
};

const ACTION_TYPES = {
  USERS_CREATE: 'users:create',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  USERS_ACTIVATE: 'users:activate',
  USERS_DEACTIVATE: 'users:deactivate',
  USERS_RESET_PASSWORD: 'users:reset_password',
};

const APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EXECUTED: 'executed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

const AUDIT_ACTIONS = {
  REQUEST_CREATED: 'approval.request_created',
  REQUEST_APPROVED: 'approval.approved',
  REQUEST_REJECTED: 'approval.rejected',
  REQUEST_EXECUTED: 'approval.executed',
  REQUEST_FAILED: 'approval.failed',
  REQUEST_CANCELLED: 'approval.cancelled',
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  USER_ACTIVATED: 'user.activated',
  USER_DEACTIVATED: 'user.deactivated',
  USER_PASSWORD_RESET: 'user.password_reset',
  AUTH_LOGIN: 'auth.login',
  AUTH_REFRESH: 'auth.refresh',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_LOGOUT_ALL: 'auth.logout_all',
};

module.exports = { PERMISSIONS, ACTION_TYPES, APPROVAL_STATUS, AUDIT_ACTIONS };
