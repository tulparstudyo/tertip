<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAdminAuth } from '@/composables/useAdminAuth';
import AuthBrand from '@/components/AuthBrand.vue';

const { t } = useI18n();
const router = useRouter();
const { login } = useAdminAuth();

const email = ref('');
const password = ref('');
const loading = ref(false);

async function handleSubmit() {
  loading.value = true;
  try {
    await login(email.value, password.value);
    router.push({ name: 'admin-dashboard' });
  } catch {
    // Toast shows server message.
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4 bg-slate-900">
    <div class="w-full max-w-md bg-white rounded-xl shadow-page p-8">
      <AuthBrand />
      <h1 class="text-xl font-semibold text-slate-800 mb-2 text-center">{{ t('admin.login.title') }}</h1>
      <p class="text-sm text-slate-500 text-center mb-6">{{ t('admin.login.subtitle') }}</p>
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div>
          <label class="block text-sm font-medium mb-1">{{ t('auth.email') }}</label>
          <input
            v-model="email"
            type="email"
            required
            class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">{{ t('auth.password') }}</label>
          <input
            v-model="password"
            type="password"
            required
            minlength="8"
            class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {{ loading ? t('common.loading') : t('admin.login.submit') }}
        </button>
      </form>
    </div>
  </div>
</template>
