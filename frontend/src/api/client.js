import { i18n } from '@/i18n';
import { toast } from '@/composables/useToast';
import {
  clearSession,
  redirectToLogin,
  refreshAccessToken,
  shouldAttemptTokenRefresh,
} from '@/api/auth-session.js';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api/v1';

function getHeaders(isFormData = false) {
  const headers = {
    'Accept-Language': i18n.global.locale.value,
  };

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const token = localStorage.getItem('tertip_access_token');
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

function shouldNotifySuccess(method, notify) {
  if (notify) return true;
  return !['GET', 'HEAD'].includes(method.toUpperCase());
}

function notifyFromResponse({ ok, data, method, notify, silent }) {
  if (silent) return;

  if (!ok) {
    toast.error(data.message ?? i18n.global.t('common.error'));
    return;
  }

  if (data.message && shouldNotifySuccess(method, notify)) {
    toast.success(data.message);
  }
}

async function performFetch(path, { method = 'GET', body, formData } = {}) {
  const isFormData = Boolean(formData);
  return fetch(`${API_BASE}${path}`, {
    method,
    headers: getHeaders(isFormData),
    body: formData ?? (body ? JSON.stringify(body) : undefined),
  });
}

export async function api(
  path,
  {
    method = 'GET',
    body,
    formData,
    silent = false,
    notify = false,
    _retried = false,
    query,
  } = {},
) {
  let requestPath = path;
  if (query && typeof query === 'object') {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined && value !== '') {
        params.set(key, String(value));
      }
    }
    const qs = params.toString();
    if (qs) requestPath = `${path}?${qs}`;
  }

  const response = await performFetch(requestPath, { method, body, formData });
  let data = await response.json().catch(() => ({}));

  if (
    !response.ok &&
    !_retried &&
    shouldAttemptTokenRefresh(response.status, path)
  ) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return api(path, { method, body, formData, silent, notify, query, _retried: true });
    }

    clearSession();
    if (!silent) {
      toast.error(data.message ?? i18n.global.t('auth.sessionExpired'));
    }
    redirectToLogin();

    const error = new Error(data.message ?? i18n.global.t('auth.sessionExpired'));
    error.status = response.status;
    error.data = data;
    throw error;
  }

  notifyFromResponse({ ok: response.ok, data, method, notify, silent });

  if (!response.ok) {
    const error = new Error(data.message ?? i18n.global.t('common.error'));
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}
