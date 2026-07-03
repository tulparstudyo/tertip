import { asyncHandler } from '../../../shared/utils/async-handler.util.js';
import { sendSuccess, sendError } from '../../../shared/utils/api-response.util.js';
import { env } from '../../../config/env.js';
import { getAuthorizationUrl, exchangeCodeForTokens } from '../../../shared/services/google-oauth.service.js';
import { revokeGoogleAccess, verifyGoogleConnection } from '../../../shared/services/google-drive.service.js';
import { signOAuthState, verifyOAuthState } from '../../../shared/utils/jwt.util.js';
import { authModel } from '../auth/auth.model.js';
import { googleModel } from './google.model.js';
import { googleView } from './google.view.js';

export const googleController = {
  connect: asyncHandler(async (req, res) => {
    try {
      const url = buildConnectUrl(req.user.id, req.deviceId);
      res.redirect(url);
    } catch (err) {
      if (err.message === 'GOOGLE_NOT_CONFIGURED') {
        return sendError(res, {
          status: 503,
          message: req.t('user.google.notConfigured'),
        });
      }
      throw err;
    }
  }),

  connectUrl: asyncHandler(async (req, res) => {
    try {
      const url = buildConnectUrl(req.user.id, req.deviceId);
      sendSuccess(res, {
        message: req.t('user.google.connect.openInBrowser'),
        data: { url },
      });
    } catch (err) {
      if (err.message === 'GOOGLE_NOT_CONFIGURED') {
        return sendError(res, {
          status: 503,
          message: req.t('user.google.notConfigured'),
        });
      }
      throw err;
    }
  }),

  callback: asyncHandler(async (req, res) => {
    const { code, state, error } = req.query;

    if (error) {
      return sendError(res, {
        status: 400,
        message: req.t('user.google.connect.denied'),
      });
    }

    if (!code || !state) {
      return sendError(res, {
        status: 400,
        message: req.t('user.google.connect.startFlow'),
      });
    }

    let statePayload;
    try {
      statePayload = verifyOAuthState(state);
    } catch {
      return sendError(res, {
        status: 400,
        message: req.t('user.google.connect.invalidState'),
      });
    }

    const session = await authModel.findValidSession(
      statePayload.sub,
      statePayload.deviceId,
    );
    if (!session) {
      return sendError(res, {
        status: 401,
        message: req.t('user.auth.sessionExpired'),
      });
    }

    const tokens = await exchangeCodeForTokens(code);
    if (!tokens.refresh_token) {
      return sendError(res, {
        status: 400,
        message: req.t('user.google.connect.noRefreshToken'),
      });
    }

    await googleModel.saveOAuthToken(statePayload.sub, tokens);

    if (env.frontendUrl) {
      return res.redirect(`${env.frontendUrl}/settings/google?connected=1`);
    }

    sendSuccess(res, { message: req.t('user.google.connect.success') });
  }),

  status: asyncHandler(async (req, res) => {
    const tokenData = await googleModel.getOAuthToken(req.user.id);
    const verification = await verifyGoogleConnection(req.user.id);
    sendSuccess(res, {
      data: googleView.formatStatus(tokenData, verification),
    });
  }),

  disconnect: asyncHandler(async (req, res) => {
    await revokeGoogleAccess(req.user.id);
    await googleModel.clearOAuthToken(req.user.id);
    sendSuccess(res, { message: req.t('user.google.disconnect.success') });
  }),
};

function buildConnectUrl(userId, deviceId) {
  const state = signOAuthState({ userId, deviceId });
  return getAuthorizationUrl(state);
}
