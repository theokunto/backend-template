const approvalService = require('../services/approval.service');

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
}

async function listApprovals(req, res, next) {
  try {
    const result = await approvalService.listRequests(req.query);
    res.json({ success: true, data: result.data, meta: result.meta });
  } catch (error) {
    next(error);
  }
}

async function getApproval(req, res, next) {
  try {
    const request = await approvalService.getRequest(req.params.id);
    res.json({ success: true, data: request });
  } catch (error) {
    next(error);
  }
}

async function approve(req, res, next) {
  try {
    const result = await approvalService.approve({
      requestId: req.params.id,
      approverId: req.user.id,
      comment: req.body.comment,
      ipAddress: getClientIp(req),
    });

    res.json({
      success: true,
      data: result,
      message: result.executed
        ? 'Request approved and executed successfully'
        : 'Approval recorded; awaiting additional approvers',
    });
  } catch (error) {
    next(error);
  }
}

async function reject(req, res, next) {
  try {
    const result = await approvalService.reject({
      requestId: req.params.id,
      approverId: req.user.id,
      reason: req.body.reason,
      ipAddress: getClientIp(req),
    });

    res.json({
      success: true,
      data: result,
      message: 'Request rejected',
    });
  } catch (error) {
    next(error);
  }
}

async function cancel(req, res, next) {
  try {
    const result = await approvalService.cancel({
      requestId: req.params.id,
      userId: req.user.id,
      ipAddress: getClientIp(req),
    });

    res.json({
      success: true,
      data: result,
      message: 'Approval request cancelled',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { listApprovals, getApproval, approve, reject, cancel };
