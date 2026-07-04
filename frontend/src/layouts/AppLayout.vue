<script setup>
import { RouterLink, RouterView, useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { watch, onMounted } from 'vue';
import { IconHome, IconFileText, IconBook, IconSettings } from '@tabler/icons-vue';
import { setLocale } from '@/i18n';
import { useAuth } from '@/composables/useAuth';
import { useNavAutoHide } from '@/composables/useNavAutoHide.js';
import { tablerIconProps } from '@/constants/icons.js';

const { t, locale } = useI18n();
const router = useRouter();
const route = useRoute();
const { user, logout } = useAuth();
const { navHidden, isEditorRoute, syncRouteState, attachScrollListener } = useNavAutoHide();

const navIcon = tablerIconProps.nav;
const headerNavIcon = tablerIconProps.headerNav;

watch(isEditorRoute, syncRouteState, { immediate: true });

onMounted(attachScrollListener);

function isNavActive(path) {
  if (path === '/') return route.path === '/';
  return route.path === path || route.path.startsWith(`${path}/`);
}

async function handleLogout() {
  await logout();
  router.push({ name: 'login' });
}

function toggleLocale() {
  setLocale(locale.value === 'tr' ? 'en' : 'tr');
}
</script>

<template>
  <div class="min-h-screen bg-slate-100">
    <header
      class="app-header bg-white border-b border-slate-200 sticky top-0 z-30"
      :class="{ 'app-header--hidden': isEditorRoute && navHidden }"
    >
      <div class="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div class="flex items-center gap-6">
          <RouterLink to="/" class="flex items-center gap-2 font-bold text-indigo-700 text-lg">
            <img src="/tertip-logo.svg" alt="" class="h-7 w-7 shrink-0 text-indigo-700" width="28" height="28" />
            {{ t('app.name') }}
          </RouterLink>
          <nav class="hidden sm:flex items-center gap-1 text-sm">
            <RouterLink
              to="/"
              class="desktop-nav-item"
              :class="{ 'desktop-nav-item--active': isNavActive('/') }"
            >
              <IconHome v-bind="headerNavIcon" aria-hidden="true" />
              {{ t('nav.dashboard') }}
            </RouterLink>
            <RouterLink
              to="/projects"
              class="desktop-nav-item"
              :class="{ 'desktop-nav-item--active': isNavActive('/projects') }"
            >
              <IconFileText v-bind="headerNavIcon" aria-hidden="true" />
              {{ t('nav.projects') }}
            </RouterLink>
            <RouterLink
              to="/library"
              class="desktop-nav-item"
              :class="{ 'desktop-nav-item--active': isNavActive('/library') }"
            >
              <IconBook v-bind="headerNavIcon" aria-hidden="true" />
              {{ t('nav.library') }}
            </RouterLink>
            <RouterLink
              to="/settings/google"
              class="desktop-nav-item"
              :class="{ 'desktop-nav-item--active': isNavActive('/settings') }"
            >
              <IconSettings v-bind="headerNavIcon" aria-hidden="true" />
              {{ t('nav.settings') }}
            </RouterLink>
          </nav>
        </div>
        <div class="flex items-center gap-3 text-sm">
          <button
            type="button"
            class="px-2 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 uppercase text-xs"
            @click="toggleLocale"
          >
            {{ locale }}
          </button>
          <span class="text-slate-500 hidden sm:inline">{{ user?.name }}</span>
          <button
            type="button"
            class="text-slate-600 hover:text-red-600"
            @click="handleLogout"
          >
            {{ t('nav.logout') }}
          </button>
        </div>
      </div>
    </header>

    <nav
      class="app-mobile-nav sm:hidden fixed bottom-0 inset-x-0 z-20 bg-white border-t border-slate-200 safe-area-pb"
      :class="{ 'app-mobile-nav--hidden': isEditorRoute && navHidden }"
      aria-label="Mobile navigation"
    >
      <div class="flex items-stretch justify-around h-14">
        <RouterLink
          to="/"
          class="mobile-nav-item"
          :class="{ 'mobile-nav-item--active': isNavActive('/') }"
          :aria-label="t('nav.dashboard')"
        >
          <IconHome v-bind="navIcon" aria-hidden="true" />
        </RouterLink>
        <RouterLink
          to="/projects"
          class="mobile-nav-item"
          :class="{ 'mobile-nav-item--active': isNavActive('/projects') }"
          :aria-label="t('nav.projects')"
        >
          <IconFileText v-bind="navIcon" aria-hidden="true" />
        </RouterLink>
        <RouterLink
          to="/library"
          class="mobile-nav-item"
          :class="{ 'mobile-nav-item--active': isNavActive('/library') }"
          :aria-label="t('nav.library')"
        >
          <IconBook v-bind="navIcon" aria-hidden="true" />
        </RouterLink>
        <RouterLink
          to="/settings/google"
          class="mobile-nav-item"
          :class="{ 'mobile-nav-item--active': isNavActive('/settings') }"
          :aria-label="t('nav.settings')"
        >
          <IconSettings v-bind="navIcon" aria-hidden="true" />
        </RouterLink>
      </div>
    </nav>

    <main class="max-w-6xl mx-auto px-4 py-8 pb-24 sm:pb-8">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-header {
  @apply transition-transform duration-300 ease-in-out will-change-transform;
}

.app-header--hidden {
  @apply -translate-y-full pointer-events-none;
}

.app-mobile-nav {
  @apply transition-transform duration-300 ease-in-out will-change-transform;
}

.app-mobile-nav--hidden {
  @apply translate-y-full pointer-events-none;
}

.desktop-nav-item {
  @apply inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-indigo-700 hover:bg-slate-50 transition-colors;
}

.desktop-nav-item--active {
  @apply text-indigo-700 font-medium bg-indigo-50;
}

.mobile-nav-item {
  @apply flex flex-1 items-center justify-center text-slate-500 transition-colors;
}

.mobile-nav-item :deep(svg) {
  @apply w-6 h-6;
}

.mobile-nav-item--active {
  @apply text-indigo-700;
}

.safe-area-pb {
  padding-bottom: env(safe-area-inset-bottom, 0);
}
</style>
