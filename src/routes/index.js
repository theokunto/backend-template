const { Router } = require('express');
const authRoutes = require('./auth.routes');
const usersRoutes = require('./users.routes');
const approvalsRoutes = require('./approvals.routes');
const approvalConfigRoutes = require('./approvalConfig.routes');
const auditRoutes = require('./audit.routes');
const docsRoutes = require('./docs.routes');
const healthController = require('../controllers/health.controller');

const router = Router();

router.get('/health/live', healthController.live);
router.get('/health/ready', healthController.ready);
router.use('/docs', docsRoutes);
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/approvals', approvalsRoutes);
router.use('/approval-configurations', approvalConfigRoutes);
router.use('/audit-logs', auditRoutes);

module.exports = router;
