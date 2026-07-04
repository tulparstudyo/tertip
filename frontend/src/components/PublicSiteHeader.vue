<script setup>
import { RouterLink } from 'vue-router';
import { useI18n } from 'vue-i18n';

defineProps({
  showNav: { type: Boolean, default: true },
});

const { t } = useI18n();
</script>

<template>
  <header class="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
    <div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
      <RouterLink to="/" class="flex items-center gap-2 font-bold text-indigo-700 text-lg">
        <img src="/tertip-logo.svg" alt="" class="h-8 w-8" width="32" height="32" />
        {{ t('app.name') }}
      </RouterLink>

      <nav v-if="showNav" class="hidden md:flex items-center gap-6 text-sm text-slate-600">
        <a href="#features" class="hover:text-indigo-700 transition-colors">{{ t('landing.nav.features') }}</a>
        <a href="#conveniences" class="hover:text-indigo-700 transition-colors">{{ t('landing.nav.conveniences') }}</a>
        <a href="#pricing" class="hover:text-indigo-700 transition-colors">{{ t('landing.nav.pricing') }}</a>
        <a href="#payment" class="hover:text-indigo-700 transition-colors">{{ t('landing.nav.payment') }}</a>
      </nav>

      <div class="hidden md:flex items-center gap-2 sm:gap-3">
        <RouterLink
          to="/login"
          class="px-3 py-2 text-sm font-medium text-slate-700 hover:text-indigo-700 transition-colors"
        >
          {{ t('landing.nav.login') }}
        </RouterLink>
        <RouterLink
          to="/register"
          class="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          {{ t('landing.nav.register') }}
        </RouterLink>
      </div>
    </div>
  </header>
</template>
