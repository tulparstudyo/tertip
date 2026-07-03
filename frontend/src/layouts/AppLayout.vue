<script setup>
import { RouterLink, RouterView, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { setLocale } from '@/i18n';
import { useAuth } from '@/composables/useAuth';

const { t, locale } = useI18n();
const router = useRouter();
const { user, logout } = useAuth();

async function handleLogout() {
  await logout();
  router.push({ name: 'login' });
}

function toggleLocale() {
  setLocale(locale.value === 'tr' ? 'en' : 'tr');
}
</script>

<template>
  <div class="min-h-screen bg-slate-100">
    <header class="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div class="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div class="flex items-center gap-6">
          <RouterLink to="/" class="font-bold text-indigo-700 text-lg">
            {{ t('app.name') }}
          </RouterLink>
          <nav class="hidden sm:flex items-center gap-4 text-sm">
            <RouterLink to="/" class="text-slate-600 hover:text-indigo-700" active-class="!text-indigo-700 font-medium">
              {{ t('nav.dashboard') }}
            </RouterLink>
            <RouterLink to="/projects" class="text-slate-600 hover:text-indigo-700" active-class="!text-indigo-700 font-medium">
              {{ t('nav.projects') }}
            </RouterLink>
            <RouterLink to="/library" class="text-slate-600 hover:text-indigo-700" active-class="!text-indigo-700 font-medium">
              {{ t('nav.library') }}
            </RouterLink>
            <RouterLink to="/settings/google" class="text-slate-600 hover:text-indigo-700" active-class="!text-indigo-700 font-medium">
              {{ t('nav.settings') }}
            </RouterLink>
          </nav>
        </div>
        <div class="flex items-center gap-3 text-sm">
          <button
            type="button"
            class="px-2 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 uppercase text-xs"
            @click="toggleLocale"
          >
            {{ locale }}
          </button>
          <span class="text-slate-500 hidden sm:inline">{{ user?.name }}</span>
          <button
            type="button"
            class="text-slate-600 hover:text-red-600"
            @click="handleLogout"
          >
            {{ t('nav.logout') }}
          </button>
        </div>
      </div>
    </header>
    <main class="max-w-6xl mx-auto px-4 py-8">
      <RouterView />
    </main>
  </div>
</template>
