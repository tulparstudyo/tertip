<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { api } from '@/api/client';
import PublicSiteHeader from '@/components/PublicSiteHeader.vue';
import PublicSiteMobileNav from '@/components/PublicSiteMobileNav.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const token = ref('');
const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const validating = ref(true);
const tokenValid = ref(false);
const done = ref(false);

async function validateToken() {
  validating.value = true;
  try {
    await api('/user/auth/reset-password/validate', {
      silent: true,
      query: { token: token.value },
    });
    tokenValid.value = true;
  } catch {
    tokenValid.value = false;
  } finally {
    validating.value = false;
  }
}

async function handleSubmit() {
  if (password.value !== confirmPassword.value) {
    return;
  }
  loading.value = true;
  try {
    await api('/user/auth/reset-password', {
      method: 'POST',
      body: { token: token.value, password: password.value },
      notify: true,
    });
    done.value = true;
    setTimeout(() => router.push({ name: 'login' }), 2000);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  token.value = String(route.query.token ?? '').trim();
  if (!token.value) {
    validating.value = false;
    tokenValid.value = false;
    return;
  }
  validateToken();
});
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 flex flex-col pb-20 md:pb-0">
    <PublicSiteHeader :show-nav="false" />

    <div class="flex-1 flex items-center justify-center px-4 py-12">
      <div class="w-full max-w-md">
        <div class="bg-white rounded-2xl shadow-page border border-slate-100 p-8">
          <div class="text-center mb-8">
            <img src="/tertip-logo.svg" alt="" class="h-12 w-12 mx-auto mb-3" width="48" height="48" />
            <h1 class="text-2xl font-bold text-slate-900">{{ t('auth.resetPassword.title') }}</h1>
          </div>

          <div v-if="validating" class="text-center text-slate-500">{{ t('common.loading') }}</div>

          <p
            v-else-if="!tokenValid"
            class="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg p-4"
          >
            {{ t('auth.resetPassword.invalidToken') }}
          </p>

          <p
            v-else-if="done"
            class="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg p-4"
          >
            {{ t('auth.resetPassword.done') }}
          </p>

          <form v-else class="space-y-4" @submit.prevent="handleSubmit">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('auth.newPassword') }}</label>
              <input
                v-model="password"
                type="password"
                required
                minlength="8"
                autocomplete="new-password"
                class="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('auth.confirmPassword') }}</label>
              <input
                v-model="confirmPassword"
                type="password"
                required
                minlength="8"
                autocomplete="new-password"
                class="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
              <p
                v-if="confirmPassword && password !== confirmPassword"
                class="text-xs text-red-600 mt-1"
              >
                {{ t('auth.passwordMismatch') }}
              </p>
            </div>
            <button
              type="submit"
              :disabled="loading || password !== confirmPassword"
              class="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {{ loading ? t('common.loading') : t('auth.resetPassword.submit') }}
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
