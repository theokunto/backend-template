const auditService = require('../services/audit.service');

async function listAuditLogs(req, res, next) {
  try {
    const result = await auditService.getLogs(req.query);
    res.json({ success: true, data: result.data, meta: { page: result.page, limit: result.limit } });
  } catch (error) {
    next(error);
  }
}

module.exports = { listAuditLogs };
