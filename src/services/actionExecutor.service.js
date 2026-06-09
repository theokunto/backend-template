const userRepository = require('../repositories/user.repository');
const { hashPassword } = require('../utils/password');
const { generateId } = require('../utils/id');
const { ACTION_TYPES } = require('../constants/permissions');
const { NotFoundError } = require('../utils/errors');
const { pool } = require('../config/database');

/**
 * Executes approved actions within a transaction.
 * Each handler maps action_type → concrete database operation.
 */
const handlers = {
  [ACTION_TYPES.USERS_CREATE]: async (payload, connection) => {
    const id = generateId();
    const passwordHash = await hashPassword(payload.password);
    const user = await userRepository.create(
      {
        id,
        email: payload.email,
        passwordHash,
        firstName: payload.firstName,
        lastName: payload.lastName,
        isActive: payload.isActive ?? true,
      },
      connection
    );

    if (payload.roleIds?.length) {
      for (const roleId of payload.roleIds) {
        await connection.execute(
          'INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)',
          [id, roleId]
        );
      }
    }

    return { entityId: id, result: user };
  },

  [ACTION_TYPES.USERS_UPDATE]: async (payload, connection) => {
    const { userId, ...fields } = payload;
    const existing = await userRepository.findById(userId, connection);
    if (!existing) throw new NotFoundError('User not found');

    const updateFields = {};
    if (fields.email) updateFields.email = fields.email;
    if (fields.firstName) updateFields.first_name = fields.firstName;
    if (fields.lastName) updateFields.last_name = fields.lastName;
    if (fields.isActive !== undefined) updateFields.is_active = fields.isActive ? 1 : 0;

    const user = await userRepository.update(userId, updateFields, connection);

    if (fields.roleIds) {
      await connection.execute('DELETE FROM user_roles WHERE user_id = ?', [userId]);
      for (const roleId of fields.roleIds) {
        await connection.execute(
          'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
          [userId, roleId]
        );
      }
    }

    return { entityId: userId, result: user };
  },

  [ACTION_TYPES.USERS_DELETE]: async (payload, connection) => {
    const existing = await userRepository.findById(payload.userId, connection);
    if (!existing) throw new NotFoundError('User not found');
    await userRepository.softDelete(payload.userId, connection);
    return { entityId: payload.userId, result: { deleted: true } };
  },

  [ACTION_TYPES.USERS_ACTIVATE]: async (payload, connection) => {
    const user = await userRepository.update(payload.userId, { is_active: 1 }, connection);
    if (!user) throw new NotFoundError('User not found');
    return { entityId: payload.userId, result: user };
  },

  [ACTION_TYPES.USERS_DEACTIVATE]: async (payload, connection) => {
    const user = await userRepository.update(payload.userId, { is_active: 0 }, connection);
    if (!user) throw new NotFoundError('User not found');
    return { entityId: payload.userId, result: user };
  },

  [ACTION_TYPES.USERS_RESET_PASSWORD]: async (payload, connection) => {
    const passwordHash = await hashPassword(payload.newPassword);
    const user = await userRepository.update(
      payload.userId,
      { password_hash: passwordHash },
      connection
    );
    if (!user) throw new NotFoundError('User not found');
    return { entityId: payload.userId, result: { passwordReset: true } };
  },
};

async function execute(actionType, payload, connection) {
  const handler = handlers[actionType];
  if (!handler) {
    throw new Error(`No executor registered for action: ${actionType}`);
  }
  return handler(payload, connection || pool);
}

module.exports = { execute };
