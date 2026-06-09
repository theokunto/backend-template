const { Router } = require('express');
const approvalsController = require('../controllers/approvals.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { PERMISSIONS } = require('../constants/permissions');
const { listApprovalsSchema, rejectSchema, approveSchema } = require('../validators/approval.validator');

const router = Router();

router.use(authenticate);

router.get('/', authorize(PERMISSIONS.APPROVALS_READ), validate(listApprovalsSchema, 'query'), approvalsController.listApprovals);
router.get('/:id', authorize(PERMISSIONS.APPROVALS_READ), approvalsController.getApproval);
router.post('/:id/approve', authorize(PERMISSIONS.APPROVALS_APPROVE), validate(approveSchema), approvalsController.approve);
router.post('/:id/reject', authorize(PERMISSIONS.APPROVALS_REJECT), validate(rejectSchema), approvalsController.reject);
router.post('/:id/cancel', authorize(PERMISSIONS.APPROVALS_CANCEL), approvalsController.cancel);

module.exports = router;
