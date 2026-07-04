import { sendError } from '../utils/api-response.util.js';

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.admin?.role || !allowedRoles.includes(req.admin.role)) {
      return sendError(res, {
        status: 403,
        message: req.t('admin.auth.forbidden'),
      });
    }
    next();
  };
}
