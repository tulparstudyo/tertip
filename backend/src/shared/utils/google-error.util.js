import { sendError } from './api-response.util.js';
import { googleModel } from '../../modules/user/google/google.model.js';
import {
  isInvalidGrantError,
  isInsufficientScopeError,
  isGoogleNetworkError,
} from './google-token.util.js';

export async function respondToGoogleError(req, res, err, userId) {
  if (err.message === 'GOOGLE_NOT_CONNECTED') {
    sendError(res, {
      status: 400,
      message: req.t('user.google.notConnected'),
    });
    return true;
  }

  if (
    err.message === 'GOOGLE_SCOPE_INSUFFICIENT' ||
    isInsufficientScopeError(err)
  ) {
    sendError(res, {
      status: 403,
      message: req.t('user.google.scopeInsufficient'),
    });
    return true;
  }

  if (err.message === 'GOOGLE_TOKEN_REVOKED' || isInvalidGrantError(err)) {
    if (userId) {
      await googleModel.clearOAuthToken(userId);
    }
    sendError(res, {
      status: 401,
      message: req.t('user.google.tokenRevoked'),
    });
    return true;
  }

  if (err.message === 'GOOGLE_NETWORK_ERROR' || isGoogleNetworkError(err)) {
    sendError(res, {
      status: 502,
      message: req.t('user.project.sync.network'),
    });
    return true;
  }

  return false;
}
