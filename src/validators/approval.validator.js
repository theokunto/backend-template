const Joi = require('joi');

const listApprovalsSchema = Joi.object({
  status: Joi.string().valid('pending', 'approved', 'rejected', 'executed', 'failed', 'cancelled'),
  actionType: Joi.string().max(100),
  requestedBy: Joi.string().uuid(),
  fromDate: Joi.date().iso(),
  toDate: Joi.date().iso(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

const rejectSchema = Joi.object({
  reason: Joi.string().min(1).max(1000).required(),
});

const approveSchema = Joi.object({
  comment: Joi.string().max(1000).optional(),
});

module.exports = { listApprovalsSchema, rejectSchema, approveSchema };
