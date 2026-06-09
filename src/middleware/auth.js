const { verifyAccessToken } = require('../utils/jwt');
const { UnauthorizedError } = require('../utils/errors');
const userRepository = require('../repositories/user.repository');

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }

    const token = header.slice(7);
    const decoded = verifyAccessToken(token);

    const user = await userRepository.findById(decoded.sub);
    if (!user || !user.is_active) {
      throw new UnauthorizedError('User account is inactive or not found');
    }

    const { roles, permissions } = await userRepository.getRolesAndPermissions(user.id);

    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      roles,
      permissions,
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Invalid or expired token'));
    }
    next(error);
  }
}

module.exports = { authenticate };
