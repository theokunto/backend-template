const approvalRepository = require('../repositories/approval.repository');
const actionExecutor = require('./actionExecutor.service');
const auditService = require('./audit.service');
const notificationService = require('./notification.service');
const { withTransaction } = require('../config/database');
const { generateId } = require('../utils/id');
const {
  APPROVAL_STATUS,
  AUDIT_ACTIONS,
} = require('../constants/permissions');
const {
  NotFoundError,
  ForbiddenError,
  ConflictError,
} = require('../utils/errors');

const ENTITY_TYPE_MAP = {
  'users:create': 'user',
  'users:update': 'user',
  'users:delete': 'user',
  'users:activate': 'user',
  'users:deactivate': 'user',
  'users:reset_password': 'user',
};

/**
 * Routes an action through approval workflow or executes immediately
 * based on approval_configurations.
 */
async function submitAction({ actionType, payload, requestedBy, entityId, ipAddress }) {
  const config = await approvalRepository.getConfig(actionType);

  if (!config || !config.requires_approval) {
    return executeImmediately({ actionType, payload, actorId: requestedBy, ipAddress });
  }

  return withTransaction(async (connection) => {
    const requestId = generateId();
    const request = await approvalRepository.createRequest(
      {
        id: requestId,
        actionType,
        entityType: ENTITY_TYPE_MAP[actionType] || 'unknown',
        entityId: entityId || payload.userId || null,
        payload,
        requestedBy,
        minApprovers: config.min_approvers,
      },
      connection
    );

    await auditService.log(
      {
        entityType: 'approval_request',
        entityId: requestId,
        action: AUDIT_ACTIONS.REQUEST_CREATED,
        actorId: requestedBy,
        details: { actionType, payload },
        ipAddress,
      },
      connection
    );

    const sanitized = sanitizeRequest(request);

    notificationService.notifyApprovalPending({
      approvalRequest: sanitized,
      requestedBy,
    });

    return {
      requiresApproval: true,
      approvalRequest: sanitized,
    };
  });
}

async function executeImmediately({ actionType, payload, actorId, ipAddress }) {
  return withTransaction(async (connection) => {
    const { entityId, result } = await actionExecutor.execute(actionType, payload, connection);

    await auditService.log(
      {
        entityType: ENTITY_TYPE_MAP[actionType] || 'unknown',
        entityId,
        action: getExecutionAuditAction(actionType),
        actorId,
        details: { actionType, immediate: true },
        ipAddress,
      },
      connection
    );

    return { requiresApproval: false, result };
  });
}

async function approve({ requestId, approverId, comment, ipAddress }) {
  const request = await approvalRepository.findById(requestId);
  if (!request) throw new NotFoundError('Approval request not found');
  if (request.status !== APPROVAL_STATUS.PENDING) {
    throw new ConflictError(`Request is already ${request.status}`);
  }

  if (request.requested_by === approverId) {
    throw new ForbiddenError('You cannot approve your own request');
  }

  const alreadyDecided = await approvalRepository.hasApproverDecided(requestId, approverId);
  if (alreadyDecided) {
    throw new ConflictError('You have already decided on this request');
  }

  return withTransaction(async (connection) => {
    await approvalRepository.recordApproverDecision(
      {
        id: generateId(),
        approvalRequestId: requestId,
        approverId,
        decision: 'approved',
        comment,
      },
      connection
    );

    const newCount = request.approval_count + 1;
    const minApprovers = request.min_approvers;

    await auditService.log(
      {
        entityType: 'approval_request',
        entityId: requestId,
        action: AUDIT_ACTIONS.REQUEST_APPROVED,
        actorId: approverId,
        details: { comment, approvalCount: newCount },
        ipAddress,
      },
      connection
    );

    if (newCount < minApprovers) {
      await approvalRepository.updateStatus(
        requestId,
        { approvalCount: newCount, approvedBy: approverId },
        connection
      );
      const updated = await approvalRepository.findById(requestId, connection);
      return { approvalRequest: sanitizeRequest(updated), executed: false };
    }

    await approvalRepository.updateStatus(
      requestId,
      { status: APPROVAL_STATUS.APPROVED, approvalCount: newCount, approvedBy: approverId },
      connection
    );

    try {
      const { entityId, result } = await actionExecutor.execute(
        request.action_type,
        request.payload,
        connection
      );

      await approvalRepository.updateStatus(
        requestId,
        { status: APPROVAL_STATUS.EXECUTED, executedAt: new Date() },
        connection
      );

      await auditService.log(
        {
          entityType: 'approval_request',
          entityId: requestId,
          action: AUDIT_ACTIONS.REQUEST_EXECUTED,
          actorId: approverId,
          details: { entityId, actionType: request.action_type },
          ipAddress,
        },
        connection
      );

      const final = await approvalRepository.findById(requestId, connection);
      return { approvalRequest: sanitizeRequest(final), executed: true, result };
    } catch (execError) {
      await approvalRepository.updateStatus(
        requestId,
        { status: APPROVAL_STATUS.FAILED, executionError: execError.message },
        connection
      );

      await auditService.log(
        {
          entityType: 'approval_request',
          entityId: requestId,
          action: AUDIT_ACTIONS.REQUEST_FAILED,
          actorId: approverId,
          details: { error: execError.message },
          ipAddress,
        },
        connection
      );

      throw execError;
    }
  });
}

async function reject({ requestId, approverId, reason, ipAddress }) {
  const request = await approvalRepository.findById(requestId);
  if (!request) throw new NotFoundError('Approval request not found');
  if (request.status !== APPROVAL_STATUS.PENDING) {
    throw new ConflictError(`Request is already ${request.status}`);
  }

  if (request.requested_by === approverId) {
    throw new ForbiddenError('You cannot reject your own request');
  }

  return withTransaction(async (connection) => {
    await approvalRepository.recordApproverDecision(
      {
        id: generateId(),
        approvalRequestId: requestId,
        approverId,
        decision: 'rejected',
        comment: reason,
      },
      connection
    );

    const updated = await approvalRepository.updateStatus(
      requestId,
      {
        status: APPROVAL_STATUS.REJECTED,
        rejectedBy: approverId,
        rejectionReason: reason,
      },
      connection
    );

    await auditService.log(
      {
        entityType: 'approval_request',
        entityId: requestId,
        action: AUDIT_ACTIONS.REQUEST_REJECTED,
        actorId: approverId,
        details: { reason },
        ipAddress,
      },
      connection
    );

    return { approvalRequest: sanitizeRequest(updated) };
  });
}

async function cancel({ requestId, userId, ipAddress }) {
  const request = await approvalRepository.findById(requestId);
  if (!request) throw new NotFoundError('Approval request not found');
  if (request.status !== APPROVAL_STATUS.PENDING) {
    throw new ConflictError(`Request is already ${request.status}`);
  }
  if (request.requested_by !== userId) {
    throw new ForbiddenError('You can only cancel your own pending requests');
  }

  return withTransaction(async (connection) => {
    const updated = await approvalRepository.updateStatus(
      requestId,
      { status: APPROVAL_STATUS.CANCELLED },
      connection
    );

    await auditService.log(
      {
        entityType: 'approval_request',
        entityId: requestId,
        action: AUDIT_ACTIONS.REQUEST_CANCELLED,
        actorId: userId,
        ipAddress,
      },
      connection
    );

    return { approvalRequest: sanitizeRequest(updated) };
  });
}

async function listRequests(filters) {
  const result = await approvalRepository.findAll(filters);
  return {
    data: result.data.map(sanitizeRequest),
    meta: { total: result.total, page: result.page, limit: result.limit },
  };
}

async function getRequest(id) {
  const request = await approvalRepository.findById(id);
  if (!request) throw new NotFoundError('Approval request not found');
  return sanitizeRequest(request);
}

function sanitizeRequest(request) {
  return {
    id: request.id,
    actionType: request.action_type,
    entityType: request.entity_type,
    entityId: request.entity_id,
    payload: request.payload,
    status: request.status,
    requestedBy: request.requested_by,
    approvedBy: request.approved_by,
    rejectedBy: request.rejected_by,
    rejectionReason: request.rejection_reason,
    approvalCount: request.approval_count,
    minApprovers: request.min_approvers,
    executionError: request.execution_error,
    createdAt: request.created_at,
    updatedAt: request.updated_at,
    executedAt: request.executed_at,
  };
}

function getExecutionAuditAction(actionType) {
  const map = {
    'users:create': AUDIT_ACTIONS.USER_CREATED,
    'users:update': AUDIT_ACTIONS.USER_UPDATED,
    'users:delete': AUDIT_ACTIONS.USER_DELETED,
    'users:activate': AUDIT_ACTIONS.USER_ACTIVATED,
    'users:deactivate': AUDIT_ACTIONS.USER_DEACTIVATED,
    'users:reset_password': AUDIT_ACTIONS.USER_PASSWORD_RESET,
  };
  return map[actionType] || actionType;
}

module.exports = {
  submitAction,
  approve,
  reject,
  cancel,
  listRequests,
  getRequest,
};
