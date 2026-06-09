const Joi = require('joi');

const loginResponseSchema = Joi.object({
  success: Joi.boolean().valid(true).required(),
  data: Joi.object({
    accessToken: Joi.string().required(),
    refreshToken: Joi.string().required(),
    user: Joi.object({
      id: Joi.string().uuid().required(),
      email: Joi.string().email().required(),
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      roles: Joi.array().items(Joi.string()).required(),
      permissions: Joi.array().items(Joi.string()).required(),
    }).required(),
  }).required(),
});

const refreshResponseSchema = Joi.object({
  success: Joi.boolean().valid(true).required(),
  data: Joi.object({
    accessToken: Joi.string().required(),
    refreshToken: Joi.string().required(),
  }).required(),
});

const approvalRequestSchema = Joi.object({
  id: Joi.string().uuid().required(),
  actionType: Joi.string().required(),
  entityType: Joi.string().required(),
  entityId: Joi.string().uuid().allow(null),
  payload: Joi.object().required(),
  status: Joi.string()
    .valid('pending', 'approved', 'rejected', 'executed', 'failed', 'cancelled')
    .required(),
  requestedBy: Joi.string().uuid().required(),
  approvedBy: Joi.string().uuid().allow(null),
  rejectedBy: Joi.string().uuid().allow(null),
  rejectionReason: Joi.string().allow(null),
  approvalCount: Joi.number().integer().min(0).required(),
  minApprovers: Joi.number().integer().min(1).required(),
  executionError: Joi.string().allow(null),
  createdAt: Joi.date().required(),
  updatedAt: Joi.date(),
  executedAt: Joi.date().allow(null),
});

const approvalConfigSchema = Joi.object({
  id: Joi.string().uuid(),
  actionType: Joi.string().required(),
  requiresApproval: Joi.boolean().required(),
  minApprovers: Joi.number().integer().min(1).required(),
  isActive: Joi.boolean().required(),
  description: Joi.string().allow(null),
  createdAt: Joi.date(),
  updatedAt: Joi.date(),
});

const errorResponseSchema = Joi.object({
  success: Joi.boolean().valid(false).required(),
  error: Joi.object({
    code: Joi.string().required(),
    message: Joi.string().required(),
    details: Joi.array().items(
      Joi.object({
        field: Joi.string(),
        message: Joi.string(),
      })
    ),
  }).required(),
});

module.exports = {
  loginResponseSchema,
  refreshResponseSchema,
  approvalRequestSchema,
  approvalConfigSchema,
  errorResponseSchema,
};
