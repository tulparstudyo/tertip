import { ref, computed } from 'vue';
import { api } from '@/api/client';
import { getDeviceId } from '@/utils/deviceId';
import { persistTokens, clearSession as clearStoredSession } from '@/api/auth-session.js';

const user = ref(null);
const accessToken = ref(localStorage.getItem('tertip_access_token'));
const refreshToken = ref(localStorage.getItem('tertip_refresh_token'));

function syncTokensFromStorage() {
  accessToken.value = localStorage.getItem('tertip_access_token');
  refreshToken.value = localStorage.getItem('tertip_refresh_token');
}

function applyTokens(data) {
  persistTokens(data);
  syncTokensFromStorage();
  user.value = data.user;
}

function clearSession() {
  clearStoredSession();
  user.value = null;
  accessToken.value = null;
  refreshToken.value = null;
}

function loadStoredUser() {
  const stored = localStorage.getItem('tertip_user');
  if (stored) {
    try {
      user.value = JSON.parse(stored);
    } catch {
      clearSession();
    }
  }
}

loadStoredUser();

export function useAuth() {
  const isAuthenticated = computed(() => Boolean(accessToken.value));
  const isEmailVerified = computed(() => Boolean(user.value?.emailVerified));

  function postAuthRoute() {
    return isEmailVerified.value ? { name: 'dashboard' } : { name: 'verify-email-pending' };
  }

  async function login(email, password) {
    const res = await api('/user/auth/login', {
      method: 'POST',
      body: { email, password, deviceId: getDeviceId() },
    });
    applyTokens(res.data);
    return res;
  }

  async function register(name, email, password) {
    const res = await api('/user/auth/register', {
      method: 'POST',
      body: { name, email, password, deviceId: getDeviceId() },
    });
    applyTokens(res.data);
    return res;
  }

  async function logout() {
    if (refreshToken.value) {
      try {
        await api('/user/auth/logout', {
          method: 'POST',
          body: { refreshToken: refreshToken.value },
        });
      } catch {
        // Session may already be invalid.
      }
    }
    clearSession();
  }

  async function fetchMe() {
    const res = await api('/user/auth/me');
    user.value = res.data;
    localStorage.setItem('tertip_user', JSON.stringify(res.data));
    return res.data;
  }

  return {
    user,
    isAuthenticated,
    isEmailVerified,
    postAuthRoute,
    login,
    register,
    logout,
    fetchMe,
  };
}
