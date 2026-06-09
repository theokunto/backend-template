const userRepository = require('../repositories/user.repository');
const refreshTokenRepository = require('../repositories/refreshToken.repository');
const auditService = require('./audit.service');
const { comparePassword } = require('../utils/password');
const { signAccessToken } = require('../utils/jwt');
const { generateRefreshToken, hashToken, getRefreshExpiresAt } = require('../utils/token');
const { generateId } = require('../utils/id');
const { withTransaction } = require('../config/database');
const { UnauthorizedError } = require('../utils/errors');
const { AUDIT_ACTIONS } = require('../constants/permissions');

async function buildUserResponse(userId) {
  const user = await userRepository.findById(userId);
  const { roles, permissions } = await userRepository.getRolesAndPermissions(userId);

  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    roles,
    permissions,
  };
}

async function issueTokenPair(userId, connection) {
  const user = await userRepository.findById(userId, connection);
  const accessToken = signAccessToken({ sub: user.id, email: user.email });

  const refreshToken = generateRefreshToken();
  const refreshTokenId = generateId();
  const familyId = generateId();

  await refreshTokenRepository.create(
    {
      id: refreshTokenId,
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      familyId,
      expiresAt: getRefreshExpiresAt(),
    },
    connection
  );

  return { accessToken, refreshToken, refreshTokenId, familyId };
}

async function login({ email, password, ipAddress }) {
  const user = await userRepository.findByEmail(email);
  if (!user || !user.is_active) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const valid = await comparePassword(password, user.password_hash);
  if (!valid) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const result = await withTransaction(async (connection) => {
    const tokens = await issueTokenPair(user.id, connection);

    await auditService.log(
      {
        entityType: 'user',
        entityId: user.id,
        action: AUDIT_ACTIONS.AUTH_LOGIN,
        actorId: user.id,
        ipAddress,
      },
      connection
    );

    return tokens;
  });

  const userResponse = await buildUserResponse(user.id);

  return {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    user: userResponse,
  };
}

async function refresh({ refreshToken, ipAddress }) {
  const tokenHash = hashToken(refreshToken);
  const stored = await refreshTokenRepository.findByTokenHash(tokenHash);

  if (!stored) {
    throw new UnauthorizedError('Invalid refresh token');
  }

  if (stored.revoked_at) {
    await refreshTokenRepository.revokeFamily(stored.family_id);
    throw new UnauthorizedError('Refresh token has been revoked');
  }

  if (new Date(stored.expires_at) <= new Date()) {
    throw new UnauthorizedError('Refresh token has expired');
  }

  const user = await userRepository.findById(stored.user_id);
  if (!user || !user.is_active) {
    throw new UnauthorizedError('User account is inactive or not found');
  }

  return withTransaction(async (connection) => {
    const newRefreshToken = generateRefreshToken();
    const newRefreshTokenId = generateId();

    await refreshTokenRepository.create(
      {
        id: newRefreshTokenId,
        userId: stored.user_id,
        tokenHash: hashToken(newRefreshToken),
        familyId: stored.family_id,
        expiresAt: getRefreshExpiresAt(),
      },
      connection
    );

    await refreshTokenRepository.revokeById(stored.id, newRefreshTokenId, connection);

    const accessToken = signAccessToken({ sub: user.id, email: user.email });

    await auditService.log(
      {
        entityType: 'user',
        entityId: user.id,
        action: AUDIT_ACTIONS.AUTH_REFRESH,
        actorId: user.id,
        details: { familyId: stored.family_id },
        ipAddress,
      },
      connection
    );

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  });
}

async function logout({ refreshToken, ipAddress }) {
  const tokenHash = hashToken(refreshToken);
  const stored = await refreshTokenRepository.findByTokenHash(tokenHash);

  if (!stored || stored.revoked_at) {
    return { loggedOut: true };
  }

  await withTransaction(async (connection) => {
    await refreshTokenRepository.revokeById(stored.id, null, connection);

    await auditService.log(
      {
        entityType: 'user',
        entityId: stored.user_id,
        action: AUDIT_ACTIONS.AUTH_LOGOUT,
        actorId: stored.user_id,
        ipAddress,
      },
      connection
    );
  });

  return { loggedOut: true };
}

async function logoutAll({ userId, ipAddress }) {
  await withTransaction(async (connection) => {
    await refreshTokenRepository.revokeAllForUser(userId, connection);

    await auditService.log(
      {
        entityType: 'user',
        entityId: userId,
        action: AUDIT_ACTIONS.AUTH_LOGOUT_ALL,
        actorId: userId,
        ipAddress,
      },
      connection
    );
  });

  return { loggedOut: true };
}

async function getProfile(userId) {
  const user = await userRepository.findById(userId);
  if (!user) throw new UnauthorizedError('User not found');

  const { roles, permissions } = await userRepository.getRolesAndPermissions(userId);

  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    isActive: !!user.is_active,
    roles,
    permissions,
    createdAt: user.created_at,
  };
}

module.exports = { login, refresh, logout, logoutAll, getProfile };
