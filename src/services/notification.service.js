const config = require('../config');
const logger = require('../utils/logger');

async function notifyApprovalPending({ approvalRequest, requestedBy }) {
  if (!config.webhook.approvalUrl) {
    return { sent: false, reason: 'webhook_not_configured' };
  }

  const payload = {
    event: 'approval.pending',
    timestamp: new Date().toISOString(),
    data: {
      approvalRequestId: approvalRequest.id,
      actionType: approvalRequest.actionType,
      entityType: approvalRequest.entityType,
      requestedBy,
      status: approvalRequest.status,
      createdAt: approvalRequest.createdAt,
    },
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.webhook.timeoutMs);

    const response = await fetch(config.webhook.approvalUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      logger.warn({ status: response.status, approvalRequestId: approvalRequest.id }, 'Approval webhook returned non-OK status');
      return { sent: false, reason: 'webhook_error', status: response.status };
    }

    return { sent: true };
  } catch (error) {
    logger.error({ err: error, approvalRequestId: approvalRequest.id }, 'Failed to send approval webhook');
    return { sent: false, reason: 'webhook_failed', error: error.message };
  }
}

module.exports = { notifyApprovalPending };
