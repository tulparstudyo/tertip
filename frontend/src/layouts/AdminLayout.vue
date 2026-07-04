<script setup>
import { RouterLink, RouterView, useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAdminAuth } from '@/composables/useAdminAuth';

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const { admin, logout, isSuperAdmin } = useAdminAuth();

const navItems = [
  { to: '/admin', name: 'admin-dashboard', label: 'admin.nav.dashboard', exact: true },
  { to: '/admin/users', name: 'admin-users', label: 'admin.nav.users' },
  { to: '/admin/payments', name: 'admin-payments', label: 'admin.nav.payments' },
  { to: '/admin/ai-logs', name: 'admin-ai-logs', label: 'admin.nav.aiLogs' },
  { to: '/admin/landing', name: 'admin-landing', label: 'admin.nav.landing' },
  { to: '/admin/theme-settings', name: 'admin-theme-settings', label: 'admin.nav.themeSettings' },
  { to: '/admin/settings', name: 'admin-settings', label: 'admin.nav.settings' },
  { to: '/admin/admins', name: 'admin-admins', label: 'admin.nav.admins', superOnly: true },
];

function isActive(item) {
  if (item.exact) return route.path === item.to;
  return route.path === item.to || route.path.startsWith(`${item.to}/`);
}

async function handleLogout() {
  await logout();
  router.push({ name: 'admin-login' });
}
</script>

<template>
  <div class="min-h-screen bg-slate-100 flex">
    <aside class="w-56 bg-slate-900 text-white flex flex-col shrink-0">
      <div class="p-4 border-b border-slate-700">
        <RouterLink to="/admin" class="flex items-center gap-2 font-bold text-lg">
          <img src="/tertip-logo.svg" alt="" class="h-7 w-7" width="28" height="28" />
          {{ t('admin.panelTitle') }}
        </RouterLink>
      </div>
      <nav class="flex-1 p-3 space-y-1">
        <RouterLink
          v-for="item in navItems"
          :key="item.name"
          v-show="!item.superOnly || isSuperAdmin"
          :to="item.to"
          class="block px-3 py-2 rounded-lg text-sm transition-colors"
          :class="isActive(item) ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'"
        >
          {{ t(item.label) }}
        </RouterLink>
      </nav>
      <div class="p-4 border-t border-slate-700 text-sm">
        <p class="text-slate-400 truncate">{{ admin?.name }}</p>
        <p class="text-slate-500 text-xs truncate">{{ admin?.email }}</p>
        <button type="button" class="mt-2 text-red-400 hover:text-red-300" @click="handleLogout">
          {{ t('nav.logout') }}
        </button>
      </div>
    </aside>

    <div class="flex-1 flex flex-col min-w-0">
      <header class="bg-white border-b border-slate-200 px-6 h-14 flex items-center">
        <h1 class="text-lg font-semibold text-slate-800">{{ t(route.meta.titleKey ?? 'admin.nav.dashboard') }}</h1>
      </header>
      <main class="flex-1 p-6 overflow-auto">
        <RouterView />
      </main>
    </div>
  </div>
</template>
