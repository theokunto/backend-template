const approvalConfigService = require('../services/approvalConfig.service');

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
}

async function listConfigs(req, res, next) {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const data = await approvalConfigService.listConfigs({ includeInactive });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

function decodeActionType(param) {
  return decodeURIComponent(param);
}

async function getConfig(req, res, next) {
  try {
    const data = await approvalConfigService.getConfig(decodeActionType(req.params.actionType));
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function updateConfig(req, res, next) {
  try {
    const data = await approvalConfigService.updateConfig({
      actionType: decodeActionType(req.params.actionType),
      updates: req.body,
      actorId: req.user.id,
      ipAddress: getClientIp(req),
    });
    res.json({ success: true, data, message: 'Approval configuration updated' });
  } catch (error) {
    next(error);
  }
}

module.exports = { listConfigs, getConfig, updateConfig };
