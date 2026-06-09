const { Router } = require('express');
const usersController = require('../controllers/users.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { PERMISSIONS } = require('../constants/permissions');
const {
  createUserSchema,
  updateUserSchema,
  resetPasswordSchema,
  listUsersSchema,
} = require('../validators/user.validator');

const router = Router();

router.use(authenticate);

router.get('/', authorize(PERMISSIONS.USERS_READ), validate(listUsersSchema, 'query'), usersController.listUsers);
router.get('/:id', authorize(PERMISSIONS.USERS_READ), usersController.getUser);
router.post('/', authorize(PERMISSIONS.USERS_CREATE), validate(createUserSchema), usersController.createUser);
router.patch('/:id', authorize(PERMISSIONS.USERS_UPDATE), validate(updateUserSchema), usersController.updateUser);
router.delete('/:id', authorize(PERMISSIONS.USERS_DELETE), usersController.deleteUser);
router.post('/:id/activate', authorize(PERMISSIONS.USERS_ACTIVATE), usersController.activateUser);
router.post('/:id/deactivate', authorize(PERMISSIONS.USERS_DEACTIVATE), usersController.deactivateUser);
router.post('/:id/reset-password', authorize(PERMISSIONS.USERS_RESET_PASSWORD), validate(resetPasswordSchema), usersController.resetPassword);

module.exports = router;
