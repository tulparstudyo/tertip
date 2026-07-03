import { asyncHandler } from '../../../shared/utils/async-handler.util.js';
import { sendSuccess, sendError } from '../../../shared/utils/api-response.util.js';
import { hashPassword, comparePassword } from '../../../shared/utils/password.util.js';
import { signUserAccessToken } from '../../../shared/utils/jwt.util.js';
import { generateRefreshToken } from '../../../shared/utils/token.util.js';
import { authModel } from './auth.model.js';
import { authView } from './auth.view.js';

function validateCredentials({ email, password, deviceId }) {
  if (!email || !password || !deviceId) {
    return 'user.auth.missingFields';
  }
  if (password.length < 8) {
    return 'user.auth.weakPassword';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'user.auth.invalidEmail';
  }
  return null;
}

async function issueTokens(user, deviceId) {
  await authModel.invalidateSessionsForDevice(user.id, deviceId);
  const refreshToken = generateRefreshToken();
  await authModel.createSession({ userId: user.id, deviceId, refreshToken });
  const accessToken = signUserAccessToken({ userId: user.id, deviceId });
  return { accessToken, refreshToken };
}

export const authController = {
  register: asyncHandler(async (req, res) => {
    const { name, email, password, deviceId } = req.body;
    const validationError = validateCredentials({ email, password, deviceId });

    if (!name?.trim()) {
      return sendError(res, { status: 400, message: req.t('user.auth.missingFields') });
    }
    if (validationError) {
      return sendError(res, { status: 400, message: req.t(validationError) });
    }

    const existing = await authModel.findByEmail(email.toLowerCase());
    if (existing) {
      return sendError(res, { status: 409, message: req.t('user.auth.emailExists') });
    }

    const passwordHash = await hashPassword(password);
    const user = await authModel.createUser({
      name: name.trim(),
      email: email.toLowerCase(),
      passwordHash,
    });

    const tokens = await issueTokens(user, deviceId);

    sendSuccess(res, {
      status: 201,
      message: req.t('user.auth.register.success'),
      data: authView.formatAuthResponse({ user, ...tokens }),
    });
  }),

  login: asyncHandler(async (req, res) => {
    const { email, password, deviceId } = req.body;
    const validationError = validateCredentials({ email, password, deviceId });

    if (validationError) {
      return sendError(res, { status: 400, message: req.t(validationError) });
    }

    const user = await authModel.findByEmail(email.toLowerCase());
    if (!user || !user.is_active) {
      return sendError(res, { status: 401, message: req.t('user.auth.invalidCredentials') });
    }

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      return sendError(res, { status: 401, message: req.t('user.auth.invalidCredentials') });
    }

    const tokens = await issueTokens(user, deviceId);

    sendSuccess(res, {
      message: req.t('user.auth.login.success'),
      data: authView.formatAuthResponse({ user, ...tokens }),
    });
  }),

  refresh: asyncHandler(async (req, res) => {
    const { refreshToken, deviceId } = req.body;

    if (!refreshToken || !deviceId) {
      return sendError(res, { status: 400, message: req.t('user.auth.missingFields') });
    }

    const session = await authModel.findSessionByRefreshToken(refreshToken);
    if (!session || session.device_id !== deviceId) {
      return sendError(res, { status: 401, message: req.t('user.auth.sessionExpired') });
    }

    const user = await authModel.findById(session.user_id);
    if (!user || !user.is_active) {
      return sendError(res, { status: 401, message: req.t('user.auth.unauthorized') });
    }

    const tokens = await issueTokens(user, deviceId);

    sendSuccess(res, {
      message: req.t('user.auth.refresh.success'),
      data: authView.formatAuthResponse({ user, ...tokens }),
    });
  }),

  logout: asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return sendError(res, { status: 400, message: req.t('user.auth.missingFields') });
    }

    await authModel.invalidateSessionByRefreshToken(refreshToken);

    sendSuccess(res, { message: req.t('user.auth.logout.success') });
  }),

  me: asyncHandler(async (req, res) => {
    const user = await authModel.findById(req.user.id);
    sendSuccess(res, { data: authView.formatUser(user) });
  }),
};
