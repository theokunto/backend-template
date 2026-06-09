const { ForbiddenError } = require('../utils/errors');

/**
 * Permission-based authorization middleware.
 * Checks req.user.permissions — never role names alone.
 *
 * @param {...string} requiredPermissions - One or more permission names (OR logic by default)
 * @param {{ requireAll?: boolean }} options - requireAll: true = AND logic
 */
function authorize(...requiredPermissions) {
  let options = {};
  if (typeof requiredPermissions[requiredPermissions.length - 1] === 'object') {
    options = requiredPermissions.pop();
  }

  const requireAll = options.requireAll ?? false;

  return (req, res, next) => {
    if (!req.user?.permissions) {
      return next(new ForbiddenError('Access denied'));
    }

    const userPerms = new Set(req.user.permissions);
    const hasAccess = requireAll
      ? requiredPermissions.every((p) => userPerms.has(p))
      : requiredPermissions.some((p) => userPerms.has(p));

    if (!hasAccess) {
      return next(new ForbiddenError('Insufficient permissions'));
    }

    next();
  };
}

module.exports = { authorize };
