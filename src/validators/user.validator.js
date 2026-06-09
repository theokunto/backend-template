const Joi = require('joi');

const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().min(1).max(100).required(),
  lastName: Joi.string().min(1).max(100).required(),
  isActive: Joi.boolean().default(true),
  roleIds: Joi.array().items(Joi.string().uuid()).optional(),
});

const updateUserSchema = Joi.object({
  email: Joi.string().email(),
  firstName: Joi.string().min(1).max(100),
  lastName: Joi.string().min(1).max(100),
  isActive: Joi.boolean(),
  roleIds: Joi.array().items(Joi.string().uuid()),
}).min(1);

const resetPasswordSchema = Joi.object({
  newPassword: Joi.string().min(8).required(),
});

const listUsersSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  resetPasswordSchema,
  listUsersSchema,
};
