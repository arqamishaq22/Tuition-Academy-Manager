import ApiError from "../utils/ApiError.js";

/**
 * Role-Based Access Control (RBAC) middleware.
 * Verifies that the authenticated user possesses one of the authorized roles.
 *
 * @param {...string} allowedRoles - Array or list of allowed roles (e.g. 'admin', 'teacher', 'staff', 'parent')
 * @returns {Function} Express middleware function
 */
export function roleGuard(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized("Authentication required prior to permission checks."));
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return next(
        ApiError.forbidden(
          `Forbidden: Role '${userRole}' is not authorized to access this resource. Requires one of: [${allowedRoles.join(
            ", "
          )}]`
        )
      );
    }

    next();
  };
}

export default roleGuard;
