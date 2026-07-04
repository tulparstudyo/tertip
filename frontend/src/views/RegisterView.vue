<script setup>
import { ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuth } from '@/composables/useAuth';
import PublicSiteHeader from '@/components/PublicSiteHeader.vue';
import PublicSiteMobileNav from '@/components/PublicSiteMobileNav.vue';

const { t } = useI18n();
const router = useRouter();
const { register } = useAuth();

const name = ref('');
const email = ref('');
const password = ref('');
const loading = ref(false);

async function handleSubmit() {
  loading.value = true;
  try {
    await register(name.value, email.value, password.value);
    router.push({ name: 'dashboard' });
  } catch {
    // API toast shows server message.
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
            <h1 class="text-2xl font-bold text-slate-900">{{ t('auth.register.title') }}</h1>
            <p class="text-slate-500 text-sm mt-2">{{ t('landing.register.subtitle') }}</p>
          </div>

          <form class="space-y-4" @submit.prevent="handleSubmit">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('auth.name') }}</label>
              <input
                v-model="name"
                type="text"
                required
                autocomplete="name"
                class="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
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
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('auth.password') }}</label>
              <input
                v-model="password"
                type="password"
                required
                minlength="8"
                autocomplete="new-password"
                class="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
            <button
              type="submit"
              :disabled="loading"
              class="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {{ loading ? t('common.loading') : t('auth.register.submit') }}
            </button>
          </form>

          <p class="mt-6 text-sm text-slate-500 text-center">
            {{ t('auth.hasAccount') }}
            <RouterLink to="/login" class="text-indigo-600 font-medium hover:underline">
              {{ t('auth.login.link') }}
            </RouterLink>
          </p>
        </div>

        <p class="text-center mt-6">
          <RouterLink to="/" class="text-sm text-slate-500 hover:text-indigo-600 transition-colors">
            ← {{ t('landing.backToHome') }}
          </RouterLink>
        </p>
      </div>
    </div>

    <PublicSiteMobileNav />
  </div>
</template>
