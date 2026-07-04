<script setup>
import { ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuth } from '@/composables/useAuth';
import AuthBrand from '@/components/AuthBrand.vue';

const { t } = useI18n();
const router = useRouter();
const { login } = useAuth();

const email = ref('');
const password = ref('');
const loading = ref(false);

async function handleSubmit() {
  loading.value = true;
  try {
    await login(email.value, password.value);
    router.push({ name: 'dashboard' });
  } catch {
    // API toast shows server message.
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="w-full max-w-md bg-white rounded-xl shadow-page p-8">
      <AuthBrand />
      <h1 class="text-xl font-semibold text-slate-800 mb-6 text-center">{{ t('auth.login.title') }}</h1>
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
          {{ loading ? t('common.loading') : t('auth.login.submit') }}
        </button>
      </form>
      <p class="mt-4 text-sm text-slate-500 text-center">
        {{ t('auth.noAccount') }}
        <RouterLink to="/register" class="text-indigo-600 hover:underline">{{ t('auth.register.link') }}</RouterLink>
      </p>
    </div>
  </div>
</template>
