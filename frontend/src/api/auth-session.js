import { getDeviceId } from '@/utils/deviceId';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api/v1';

export function persistTokens(data) {
  if (!data?.accessToken || !data?.refreshToken) return;
  localStorage.setItem('tertip_access_token', data.accessToken);
  localStorage.setItem('tertip_refresh_token', data.refreshToken);
  if (data.user) {
    localStorage.setItem('tertip_user', JSON.stringify(data.user));
  }
}

export function clearSession() {
  localStorage.removeItem('tertip_access_token');
  localStorage.removeItem('tertip_refresh_token');
  localStorage.removeItem('tertip_user');
}

export function redirectToLogin() {
  const path = window.location.pathname;
  if (path !== '/login' && path !== '/register') {
    window.location.assign('/login');
  }
}

let refreshPromise = null;

export async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('tertip_refresh_token');
  if (!refreshToken) return false;

  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE}/user/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          refreshToken,
          deviceId: getDeviceId(),
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.data?.accessToken) {
        return false;
      }

      persistTokens(data.data);
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export function shouldAttemptTokenRefresh(status, path) {
  if (status !== 401) return false;
  if (!localStorage.getItem('tertip_refresh_token')) return false;

  const authPath = path.split('?')[0];
  if (
    authPath === '/user/auth/login' ||
    authPath === '/user/auth/register' ||
    authPath === '/user/auth/refresh'
  ) {
    return false;
  }

  return true;
}
