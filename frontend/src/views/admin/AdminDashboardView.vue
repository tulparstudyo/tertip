<script setup>
import { RouterLink } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAdminAuth } from '@/composables/useAdminAuth';

const { t } = useI18n();
const { admin } = useAdminAuth();
</script>

<template>
  <div class="space-y-6">
    <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h2 class="text-xl font-semibold text-slate-800">
        {{ t('admin.dashboard.welcome', { name: admin?.name ?? '' }) }}
      </h2>
      <p class="text-slate-500 mt-2">{{ t('admin.dashboard.subtitle') }}</p>
    </div>

    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <RouterLink
        to="/admin/users"
        class="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:border-indigo-300 transition-colors"
      >
        <p class="text-sm text-slate-500">{{ t('admin.nav.users') }}</p>
        <p class="text-lg font-semibold text-slate-800 mt-1">{{ t('admin.dashboard.manageUsers') }}</p>
      </RouterLink>
      <RouterLink
        to="/admin/payments"
        class="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:border-indigo-300 transition-colors"
      >
        <p class="text-sm text-slate-500">{{ t('admin.nav.payments') }}</p>
        <p class="text-lg font-semibold text-slate-800 mt-1">{{ t('admin.dashboard.reviewPayments') }}</p>
      </RouterLink>
      <RouterLink
        to="/admin/landing"
        class="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:border-indigo-300 transition-colors"
      >
        <p class="text-sm text-slate-500">{{ t('admin.nav.landing') }}</p>
        <p class="text-lg font-semibold text-slate-800 mt-1">{{ t('admin.dashboard.editLanding') }}</p>
      </RouterLink>
      <RouterLink
        v-if="admin?.role === 'super_admin'"
        to="/admin/admins"
        class="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:border-indigo-300 transition-colors"
      >
        <p class="text-sm text-slate-500">{{ t('admin.nav.admins') }}</p>
        <p class="text-lg font-semibold text-slate-800 mt-1">{{ t('admin.dashboard.manageAdmins') }}</p>
      </RouterLink>
    </div>
  </div>
</template>