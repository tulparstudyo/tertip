import { sendError } from '../utils/api-response.util.js';
import { verifyAdminAccessToken } from '../utils/jwt.util.js';
import { authModel } from '../../modules/admin/auth/auth.model.js';

export async function adminAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return sendError(res, {
        status: 401,
        message: req.t('admin.auth.unauthorized'),
      });
    }

    const token = authHeader.slice(7);
    let payload;

    try {
      payload = verifyAdminAccessToken(token);
    } catch {
      return sendError(res, {
        status: 401,
        message: req.t('admin.auth.invalidToken'),
      });
    }

    if (payload.type !== 'admin' || !payload.sub) {
      return sendError(res, {
        status: 401,
        message: req.t('admin.auth.invalidToken'),
      });
    }

    const admin = await authModel.findById(payload.sub);
    if (!admin || !admin.is_active) {
      return sendError(res, {
        status: 401,
        message: req.t('admin.auth.unauthorized'),
      });
    }

    req.admin = { id: admin.id, email: admin.email, name: admin.name, role: admin.role };
    next();
  } catch (err) {
    next(err);
  }
}
