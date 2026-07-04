import { i18n } from '@/i18n';
import { toast } from '@/composables/useToast';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api/v1';

function getHeaders() {
  const headers = {
    'Content-Type': 'application/json',
    'Accept-Language': i18n.global.locale.value,
  };

  const token = localStorage.getItem('tertip_admin_access_token');
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

function notifyFromResponse({ ok, data, method, notify, silent }) {
  if (silent) return;
  if (!ok) {
    toast.error(data.message ?? i18n.global.t('common.error'));
    return;
  }
  if (data.message && notify && method !== 'GET') {
    toast.success(data.message);
  }
}

export async function adminApi(
  path,
  { method = 'GET', body, silent = false, notify = false, query } = {},
) {
  let requestPath = path.startsWith('/admin') ? path : `/admin${path}`;
  if (query && typeof query === 'object') {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined && value !== '') {
        params.set(key, String(value));
      }
    }
    const qs = params.toString();
    if (qs) requestPath = `${requestPath}?${qs}`;
  }

  const response = await fetch(`${API_BASE}${requestPath}`, {
    method,
    headers: getHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok && response.status === 401) {
    localStorage.removeItem('tertip_admin_access_token');
    localStorage.removeItem('tertip_admin');
    if (window.location.pathname !== '/admin/login') {
      window.location.assign('/admin/login');
    }
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
