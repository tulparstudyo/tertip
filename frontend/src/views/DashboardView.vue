<script setup>
import { computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { IconFileText, IconBook, IconSparkles, IconSettings, IconReceipt } from '@tabler/icons-vue';
import { useAuth } from '@/composables/useAuth';
import { tablerIconProps } from '@/constants/icons.js';

const { t, locale } = useI18n();
const { user, fetchMe } = useAuth();

const cardIcon = { ...tablerIconProps.headerNav, size: 20 };

const remaining = computed(() => {
  const quota = user.value?.aiCommandQuota ?? 0;
  const used = user.value?.aiCommandsUsed ?? 0;
  return Math.max(0, quota - used);
});

const usagePercent = computed(() => {
  const quota = user.value?.aiCommandQuota ?? 0;
  if (!quota) return 0;
  return Math.min(100, Math.round(((user.value?.aiCommandsUsed ?? 0) / quota) * 100));
});

const quotaBarClass = computed(() => {
  if (usagePercent.value >= 90) return 'bg-red-500';
  if (usagePercent.value >= 70) return 'bg-amber-500';
  return 'bg-indigo-500';
});

const resetDate = computed(() => {
  const periodStart = user.value?.aiQuotaPeriodStart;
  if (!periodStart) return null;
  const start = new Date(periodStart);
  const nextMonth = new Date(start.getFullYear(), start.getMonth() + 1, 1);
  return nextMonth.toLocaleDateString(locale.value === 'en' ? 'en-US' : 'tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
});

onMounted(() => {
  fetchMe().catch(() => {});
});
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-2">{{ t('dashboard.welcome', { name: user?.displayName ?? user?.name ?? '' }) }}</h1>
    <p class="text-slate-600 mb-8">{{ t('dashboard.subtitle') }}</p>

    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <RouterLink
        to="/app/projects"
        class="bg-white rounded-xl p-6 shadow-page hover:shadow-lg transition-shadow border border-slate-100"
      >
        <h3 class="font-semibold text-indigo-700 mb-1 flex items-center gap-2">
          <IconFileText v-bind="cardIcon" aria-hidden="true" />
          {{ t('nav.projects') }}
        </h3>
        <p class="text-sm text-slate-500">{{ t('projects.title') }}</p>
      </RouterLink>
      <RouterLink
        to="/app/library"
        class="bg-white rounded-xl p-6 shadow-page hover:shadow-lg transition-shadow border border-slate-100"
      >
        <h3 class="font-semibold text-indigo-700 mb-1 flex items-center gap-2">
          <IconBook v-bind="cardIcon" aria-hidden="true" />
          {{ t('nav.library') }}
        </h3>
        <p class="text-sm text-slate-500">{{ t('library.title') }}</p>
      </RouterLink>
      <RouterLink
        to="/app/ai-usage"
        class="bg-white rounded-xl p-6 shadow-page hover:shadow-lg transition-shadow border border-slate-100"
      >
        <h3 class="font-semibold text-indigo-700 mb-1 flex items-center gap-2">
          <IconSparkles v-bind="cardIcon" aria-hidden="true" />
          {{ t('nav.aiUsage') }}
        </h3>
        <p class="text-sm text-slate-500">{{ t('aiUsage.subtitle') }}</p>
      </RouterLink>
      <RouterLink
        to="/app/payments"
        class="bg-white rounded-xl p-6 shadow-page hover:shadow-lg transition-shadow border border-slate-100"
      >
        <h3 class="font-semibold text-indigo-700 mb-1 flex items-center gap-2">
          <IconReceipt v-bind="cardIcon" aria-hidden="true" />
          {{ t('nav.payments') }}
        </h3>
        <p class="text-sm text-slate-500">{{ t('payments.subtitle') }}</p>
      </RouterLink>
      <RouterLink
        to="/app/settings/google"
        class="bg-white rounded-xl p-6 shadow-page hover:shadow-lg transition-shadow border border-slate-100"
      >
        <h3 class="font-semibold text-indigo-700 mb-1 flex items-center gap-2">
          <IconSettings v-bind="cardIcon" aria-hidden="true" />
          {{ t('nav.settings') }}
        </h3>
        <p class="text-sm text-slate-500">{{ t('settings.google.title') }}</p>
      </RouterLink>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 p-5 mt-8 shadow-page">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="text-sm font-medium text-slate-500 mb-1">{{ t('dashboard.aiQuota.title') }}</p>
          <p class="text-3xl font-bold text-slate-800">
            {{ remaining }}
            <span class="text-lg font-normal text-slate-500">/ {{ user?.aiCommandQuota ?? 0 }}</span>
          </p>
          <p class="text-sm text-slate-500 mt-1">
            {{ t('dashboard.aiQuota.remaining') }}
            <span v-if="resetDate"> · {{ t('dashboard.aiQuota.resetsOn', { date: resetDate }) }}</span>
          </p>
        </div>
        <RouterLink
          to="/app/ai-usage"
          class="text-sm text-indigo-600 hover:underline font-medium"
        >
          {{ t('dashboard.aiQuota.viewHistory') }} →
        </RouterLink>
      </div>
      <div class="mt-4 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          class="h-full rounded-full transition-all"
          :class="quotaBarClass"
          :style="{ width: `${usagePercent}%` }"
        />
      </div>
      <p class="text-xs text-slate-400 mt-2">
        {{ t('dashboard.aiQuota.used', { used: user?.aiCommandsUsed ?? 0, quota: user?.aiCommandQuota ?? 0 }) }}
      </p>
    </div>
  </div>
</template>
