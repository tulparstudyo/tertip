const OAUTH_CREDENTIAL_KEYS = [
  'access_token',
  'refresh_token',
  'scope',
  'token_type',
  'expiry_date',
  'id_token',
];

const NETWORK_ERROR_CODES = new Set([
  'ENOTFOUND',
  'ETIMEDOUT',
  'ECONNRESET',
  'ECONNREFUSED',
  'EAI_AGAIN',
  'UND_ERR_CONNECT_TIMEOUT',
]);

const NETWORK_ERROR_PATTERN =
  /ECONN|ETIMEDOUT|ENOTFOUND|fetch failed|socket hang up|ECONNREFUSED/i;

export function isInvalidGrantError(err) {
  for (let current = err; current; current = current.cause) {
    const message = current?.message ?? '';
    const apiError = current?.response?.data?.error ?? '';
    if (/invalid_grant/i.test(message) || apiError === 'invalid_grant') {
      return true;
    }
  }
  return false;
}

export function isGoogleNetworkError(err) {
  for (let current = err; current; current = current.cause) {
    const code = current?.code ?? '';
    if (NETWORK_ERROR_CODES.has(code)) return true;
    const message = current?.message ?? '';
    if (NETWORK_ERROR_PATTERN.test(message)) return true;
  }
  return false;
}

export function isInsufficientScopeError(err) {
  for (let current = err; current; current = current.cause) {
    const message = current?.response?.data?.error?.message ?? current?.message ?? '';
    if (/insufficient authentication scopes?/i.test(message)) return true;
  }
  return false;
}

export function hasRequiredGoogleScopes(stored, requiredScopes) {
  const granted = new Set((stored?.scope ?? '').split(' ').filter(Boolean));
  return requiredScopes.every((scope) => granted.has(scope));
}

export function pickOAuthCredentials(stored) {
  if (!stored) return {};
  const credentials = {};
  for (const key of OAUTH_CREDENTIAL_KEYS) {
    if (stored[key] != null) {
      credentials[key] = stored[key];
    }
  }
  return credentials;
}

export function mergeStoredOAuthToken(stored, newTokens) {
  const merged = { ...(stored ?? {}), ...pickOAuthCredentials({ ...stored, ...newTokens }) };
  if (newTokens.refresh_token) {
    merged.refresh_token = newTokens.refresh_token;
  }
  return merged;
}
