<script setup>
import { ref } from 'vue';
import { RouterLink } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { api } from '@/api/client';
import PublicSiteHeader from '@/components/PublicSiteHeader.vue';
import PublicSiteMobileNav from '@/components/PublicSiteMobileNav.vue';

const { t } = useI18n();

const email = ref('');
const loading = ref(false);
const sent = ref(false);

async function handleSubmit() {
  loading.value = true;
  try {
    await api('/user/auth/forgot-password', {
      method: 'POST',
      body: { email: email.value },
      notify: true,
    });
    sent.value = true;
  } finally {
    loading.value = false;
  }
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
            <h1 class="text-2xl font-bold text-slate-900">{{ t('auth.forgotPassword.title') }}</h1>
            <p class="text-slate-500 text-sm mt-2">{{ t('auth.forgotPassword.subtitle') }}</p>
          </div>

          <p v-if="sent" class="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg p-4 mb-4">
            {{ t('auth.forgotPassword.sent') }}
          </p>

          <form v-if="!sent" class="space-y-4" @submit.prevent="handleSubmit">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('auth.email') }}</label>
              <input
                v-model="email"
                type="email"
                required
                autocomplete="email"
                class="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
            <button
              type="submit"
              :disabled="loading"
              class="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {{ loading ? t('common.loading') : t('auth.forgotPassword.submit') }}
            </button>
          </form>

          <p class="mt-6 text-sm text-slate-500 text-center">
            <RouterLink to="/login" class="text-indigo-600 font-medium hover:underline">
              {{ t('auth.login.link') }}
            </RouterLink>
          </p>
        </div>
      </div>
    </div>

    <PublicSiteMobileNav />
  </div>
</template>
