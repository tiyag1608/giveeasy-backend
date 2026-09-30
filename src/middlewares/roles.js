/**
 * Role-Based Access Control (RBAC) Middleware
 * Restricts route access to specified roles
 * @param  {...string} roles - e.g. 'admin', 'ngo_admin', 'donor'
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before checking authorization.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: User role '${req.user.role}' is not authorized to access this resource. Allowed roles: [${roles.join(', ')}]`,
      });
    }

    next();
  };
};

module.exports = { authorize };
