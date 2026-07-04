<script setup>
import { RouterLink } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuth } from '@/composables/useAuth';

const { t } = useI18n();
const { user } = useAuth();
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-2">{{ t('dashboard.welcome', { name: user?.name ?? '' }) }}</h1>
    <p class="text-slate-600 mb-8">{{ t('dashboard.subtitle') }}</p>
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <RouterLink
        to="/app/projects"
        class="bg-white rounded-xl p-6 shadow-page hover:shadow-lg transition-shadow border border-slate-100"
      >
        <h2 class="font-semibold text-indigo-700 mb-1">{{ t('nav.projects') }}</h2>
        <p class="text-sm text-slate-500">{{ t('projects.title') }}</p>
      </RouterLink>
      <RouterLink
        to="/app/library"
        class="bg-white rounded-xl p-6 shadow-page hover:shadow-lg transition-shadow border border-slate-100"
      >
        <h2 class="font-semibold text-indigo-700 mb-1">{{ t('nav.library') }}</h2>
        <p class="text-sm text-slate-500">{{ t('library.title') }}</p>
      </RouterLink>
      <RouterLink
        to="/app/settings/google"
        class="bg-white rounded-xl p-6 shadow-page hover:shadow-lg transition-shadow border border-slate-100"
      >
        <h2 class="font-semibold text-indigo-700 mb-1">{{ t('nav.settings') }}</h2>
        <p class="text-sm text-slate-500">{{ t('settings.google.title') }}</p>
      </RouterLink>
    </div>
  </div>
</template>
