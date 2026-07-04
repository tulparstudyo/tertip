<script setup>
import { ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { api } from '@/api/client';
import { useAuth } from '@/composables/useAuth';
import PublicSiteHeader from '@/components/PublicSiteHeader.vue';
import PublicSiteMobileNav from '@/components/PublicSiteMobileNav.vue';

const { t } = useI18n();
const router = useRouter();
const { user, logout } = useAuth();

const loading = ref(false);
const sent = ref(false);

async function resend() {
  loading.value = true;
  try {
    await api('/user/auth/resend-verification', {
      method: 'POST',
      notify: true,
    });
    sent.value = true;
  } finally {
    loading.value = false;
  }
}

async function handleLogout() {
  await logout();
  router.push({ name: 'login' });
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 flex flex-col pb-20 md:pb-0">
    <PublicSiteHeader :show-nav="false" />

    <div class="flex-1 flex items-center justify-center px-4 py-12">
      <div class="w-full max-w-md">
        <div class="bg-white rounded-2xl shadow-page border border-slate-100 p-8">
          <div class="text-center mb-8">
            <img src="/tertip-logo.svg" alt="" class="h-12 w-12 mx-auto mb-3" width="48" height="48" />
            <h1 class="text-2xl font-bold text-slate-900">{{ t('auth.verifyEmail.pendingTitle') }}</h1>
            <p class="text-slate-500 text-sm mt-2">{{ t('auth.verifyEmail.pendingSubtitle') }}</p>
          </div>

          <p class="text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-lg p-4 mb-4">
            {{ t('auth.verifyEmail.sentTo', { email: user?.email ?? '' }) }}
          </p>

          <p
            v-if="sent"
            class="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg p-4 mb-4"
          >
            {{ t('auth.verifyEmail.resent') }}
          </p>

          <button
            type="button"
            :disabled="loading"
            class="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            @click="resend"
          >
            {{ loading ? t('common.loading') : t('auth.verifyEmail.resend') }}
          </button>

          <p class="mt-6 text-sm text-slate-500 text-center">
            <button type="button" class="text-indigo-600 font-medium hover:underline" @click="handleLogout">
              {{ t('nav.logout') }}
            </button>
            <span class="mx-2">·</span>
            <RouterLink to="/" class="text-indigo-600 font-medium hover:underline">
              {{ t('landing.backToHome') }}
            </RouterLink>
          </p>
        </div>
      </div>
    </div>

    <PublicSiteMobileNav />
  </div>
</template>
