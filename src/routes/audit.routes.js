const { Router } = require('express');
const auditController = require('../controllers/audit.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { PERMISSIONS } = require('../constants/permissions');

const router = Router();

router.use(authenticate);
router.get('/', authorize(PERMISSIONS.AUDIT_READ), auditController.listAuditLogs);

module.exports = router;
