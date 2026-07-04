import { sendError } from '../utils/api-response.util.js';
import { authModel } from '../../modules/user/auth/auth.model.js';

export async function requireEmailVerifiedMiddleware(req, res, next) {
  const user = await authModel.findById(req.user.id);
  if (!user?.email_verified_at) {
    return sendError(res, {
      status: 403,
      message: req.t('user.auth.emailNotVerified'),
    });
  }
  next();
}
