import { sendError } from '../utils/api-response.util.js';
import { verifyUserAccessToken } from '../utils/jwt.util.js';
import { authModel } from '../../modules/user/auth/auth.model.js';

export async function userAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return sendError(res, {
        status: 401,
        message: req.t('user.auth.unauthorized'),
      });
    }

    const token = authHeader.slice(7);
    let payload;

    try {
      payload = verifyUserAccessToken(token);
    } catch {
      return sendError(res, {
        status: 401,
        message: req.t('user.auth.invalidToken'),
      });
    }

    if (payload.type !== 'user' || !payload.sub || !payload.deviceId) {
      return sendError(res, {
        status: 401,
        message: req.t('user.auth.invalidToken'),
      });
    }

    const session = await authModel.findValidSession(payload.sub, payload.deviceId);
    if (!session) {
      return sendError(res, {
        status: 401,
        message: req.t('user.auth.sessionExpired'),
      });
    }

    const user = await authModel.findById(payload.sub);
    if (!user || !user.is_active) {
      return sendError(res, {
        status: 401,
        message: req.t('user.auth.unauthorized'),
      });
    }

    req.user = { id: user.id, email: user.email, name: user.name };
    req.deviceId = payload.deviceId;
    next();
  } catch (err) {
    next(err);
  }
}
