const Joi = require('joi');

const updateApprovalConfigSchema = Joi.object({
  requiresApproval: Joi.boolean(),
  minApprovers: Joi.number().integer().min(1).max(10),
  isActive: Joi.boolean(),
  description: Joi.string().max(255).allow('', null),
}).min(1);

module.exports = { updateApprovalConfigSchema };
