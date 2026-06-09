const { Router } = require('express');
const approvalConfigController = require('../controllers/approvalConfig.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { PERMISSIONS } = require('../constants/permissions');
const { updateApprovalConfigSchema } = require('../validators/approvalConfig.validator');

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorize(PERMISSIONS.APPROVAL_CONFIG_READ),
  approvalConfigController.listConfigs
);
router.get(
  '/:actionType',
  authorize(PERMISSIONS.APPROVAL_CONFIG_READ),
  approvalConfigController.getConfig
);
router.patch(
  '/:actionType',
  authorize(PERMISSIONS.APPROVAL_CONFIG_UPDATE),
  validate(updateApprovalConfigSchema),
  approvalConfigController.updateConfig
);

module.exports = router;
