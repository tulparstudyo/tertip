<script setup>
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
  IconSparkles,
  IconWand,
  IconTags,
  IconBuildingBank,
  IconLogin,
} from '@tabler/icons-vue';
import { tablerIconProps } from '@/constants/icons.js';
import WhatsAppMobileNavLink from '@/components/WhatsAppMobileNavLink.vue';

const { t } = useI18n();
const route = useRoute();

const navIcon = tablerIconProps.nav;

const items = computed(() => [
  { id: 'features', hash: '#features', label: 'landing.nav.features', icon: IconSparkles },
  { id: 'conveniences', hash: '#conveniences', label: 'landing.nav.conveniences', icon: IconWand },
  { id: 'pricing', hash: '#pricing', label: 'landing.nav.pricing', icon: IconTags },
  { id: 'payment', hash: '#payment', label: 'landing.nav.payment', icon: IconBuildingBank },
  { id: 'login', to: '/login', label: 'landing.nav.login', icon: IconLogin },
]);

function isActive(item) {
  if (item.to) return route.path === item.to;
  return route.path === '/' && route.hash === item.hash;
}
</script>

<template>
  <nav
    class="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 safe-area-pb shadow-[0_-4px_24px_rgba(0,0,0,0.06)]"
    :aria-label="t('landing.mobileNav.label')"
  >
    <div class="flex items-stretch justify-around h-16 max-w-lg mx-auto">
      <RouterLink
        v-for="item in items"
        :key="item.id"
        :to="item.to ?? { path: '/', hash: item.hash }"
        class="public-mobile-nav-item"
        :class="{ 'public-mobile-nav-item--active': isActive(item) }"
        :aria-label="t(item.label)"
      >
        <component :is="item.icon" v-bind="navIcon" aria-hidden="true" />
        <span class="public-mobile-nav-item__label">{{ t(item.label) }}</span>
      </RouterLink>
      <WhatsAppMobileNavLink variant="public" />
    </div>
  </nav>
</template>

<style scoped>
.public-mobile-nav-item {
  @apply flex flex-1 flex-col items-center justify-center gap-0.5 px-1 text-slate-500 transition-colors min-w-0;
}

.public-mobile-nav-item :deep(svg) {
  @apply w-6 h-6 shrink-0;
}

.public-mobile-nav-item__label {
  @apply text-[10px] leading-tight font-medium truncate max-w-full;
}

.public-mobile-nav-item--active {
  @apply text-indigo-700;
}

.safe-area-pb {
  padding-bottom: env(safe-area-inset-bottom, 0);
}
</style>
