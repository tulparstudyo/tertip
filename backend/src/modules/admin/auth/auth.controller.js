import { asyncHandler } from '../../../shared/utils/async-handler.util.js';
import { sendSuccess, sendError } from '../../../shared/utils/api-response.util.js';
import { comparePassword } from '../../../shared/utils/password.util.js';
import { signAdminAccessToken } from '../../../shared/utils/jwt.util.js';
import { authModel } from './auth.model.js';
import { authView } from './auth.view.js';

export const authController = {
  login: asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, { status: 400, message: req.t('admin.auth.missingFields') });
    }

    const admin = await authModel.findByEmail(email.toLowerCase());
    if (!admin || !admin.is_active) {
      return sendError(res, { status: 401, message: req.t('admin.auth.invalidCredentials') });
    }

    const valid = await comparePassword(password, admin.password_hash);
    if (!valid) {
      return sendError(res, { status: 401, message: req.t('admin.auth.invalidCredentials') });
    }

    await authModel.updateLastLogin(admin.id);
    const accessToken = signAdminAccessToken({ adminId: admin.id, role: admin.role });

    sendSuccess(res, {
      message: req.t('admin.auth.login.success'),
      data: authView.formatAuthResponse({ admin, accessToken }),
    });
  }),

  me: asyncHandler(async (req, res) => {
    const admin = await authModel.findById(req.admin.id);
    sendSuccess(res, { data: authView.formatAdmin(admin) });
  }),
};
