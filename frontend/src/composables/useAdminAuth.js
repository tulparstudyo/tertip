import { ref, computed } from 'vue';
import { adminApi } from '@/api/admin-client';

const admin = ref(null);
const accessToken = ref(localStorage.getItem('tertip_admin_access_token'));

function loadStoredAdmin() {
  const stored = localStorage.getItem('tertip_admin');
  if (stored) {
    try {
      admin.value = JSON.parse(stored);
    } catch {
      clearSession();
    }
  }
}

function clearSession() {
  localStorage.removeItem('tertip_admin_access_token');
  localStorage.removeItem('tertip_admin');
  admin.value = null;
  accessToken.value = null;
}

loadStoredAdmin();

export function useAdminAuth() {
  const isAuthenticated = computed(() => Boolean(accessToken.value));
  const isSuperAdmin = computed(() => admin.value?.role === 'super_admin');

  async function login(email, password) {
    const res = await adminApi('/auth/login', {
      method: 'POST',
      body: { email, password },
      notify: true,
    });
    localStorage.setItem('tertip_admin_access_token', res.data.accessToken);
    localStorage.setItem('tertip_admin', JSON.stringify(res.data.admin));
    accessToken.value = res.data.accessToken;
    admin.value = res.data.admin;
    return res;
  }

  async function logout() {
    clearSession();
  }

  async function fetchMe() {
    const res = await adminApi('/auth/me', { silent: true });
    admin.value = res.data;
    localStorage.setItem('tertip_admin', JSON.stringify(res.data));
    return res.data;
  }

  return {
    admin,
    isAuthenticated,
    isSuperAdmin,
    login,
    logout,
    fetchMe,
  };
}
