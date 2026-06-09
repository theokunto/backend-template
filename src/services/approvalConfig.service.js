const approvalConfigRepository = require('../repositories/approvalConfig.repository');
const auditService = require('./audit.service');
const { NotFoundError } = require('../utils/errors');

function formatConfig(row) {
  return {
    id: row.id,
    actionType: row.action_type,
    requiresApproval: !!row.requires_approval,
    minApprovers: row.min_approvers,
    isActive: !!row.is_active,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function listConfigs({ includeInactive = false } = {}) {
  const rows = await approvalConfigRepository.findAll({ includeInactive });
  return rows.map(formatConfig);
}

async function getConfig(actionType) {
  const row = await approvalConfigRepository.findByActionType(actionType);
  if (!row) throw new NotFoundError('Approval configuration not found');
  return formatConfig(row);
}

async function updateConfig({ actionType, updates, actorId, ipAddress }) {
  const existing = await approvalConfigRepository.findByActionType(actionType);
  if (!existing) throw new NotFoundError('Approval configuration not found');

  const row = await approvalConfigRepository.update(actionType, updates);

  await auditService.log({
    entityType: 'approval_configuration',
    entityId: row.id,
    action: 'approval_config.updated',
    actorId,
    details: { actionType, updates },
    ipAddress,
  });

  return formatConfig(row);
}

module.exports = { listConfigs, getConfig, updateConfig };
