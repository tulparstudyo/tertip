<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { api } from '@/api/client';
import { useAuth } from '@/composables/useAuth';
import PublicSiteHeader from '@/components/PublicSiteHeader.vue';
import PublicSiteMobileNav from '@/components/PublicSiteMobileNav.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { isAuthenticated, fetchMe } = useAuth();

const token = ref('');
const validating = ref(true);
const tokenValid = ref(false);
const verifying = ref(false);
const done = ref(false);

async function validateToken() {
  validating.value = true;
  try {
    await api('/user/auth/verify-email/validate', {
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

async function verify() {
  verifying.value = true;
  try {
    await api('/user/auth/verify-email', {
      method: 'POST',
      body: { token: token.value },
      notify: true,
    });
    done.value = true;
    if (isAuthenticated.value) {
      await fetchMe().catch(() => {});
      setTimeout(() => router.push({ name: 'dashboard' }), 1500);
    } else {
      setTimeout(() => router.push({ name: 'login' }), 2000);
    }
  } finally {
    verifying.value = false;
  }
}

onMounted(async () => {
  token.value = String(route.query.token ?? '').trim();
  if (!token.value) {
    validating.value = false;
    tokenValid.value = false;
    return;
  }
  await validateToken();
  if (tokenValid.value) {
    await verify();
  }
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
            <h1 class="text-2xl font-bold text-slate-900">{{ t('auth.verifyEmail.title') }}</h1>
          </div>

          <div v-if="validating || verifying" class="text-center text-slate-500">
            {{ t('common.loading') }}
          </div>

          <p
            v-else-if="!tokenValid"
            class="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg p-4"
          >
            {{ t('auth.verifyEmail.invalidToken') }}
          </p>

          <p
            v-else-if="done"
            class="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg p-4"
          >
            {{ t('auth.verifyEmail.done') }}
          </p>

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
