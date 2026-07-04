<script setup>
import { onMounted } from 'vue';
import { RouterView } from 'vue-router';
import ToastContainer from '@/components/ToastContainer.vue';
import WhatsAppContactButton from '@/components/WhatsAppContactButton.vue';
import { useSiteConfig } from '@/composables/useSiteConfig.js';
import { useThemeSettings } from '@/composables/useThemeSettings.js';

const { loadSiteConfig } = useSiteConfig();
const { loadThemeSettings } = useThemeSettings();

onMounted(() => {
  void loadSiteConfig();
  void loadThemeSettings();
});
</script>

<template>
  <RouterView />
  <ToastContainer />
  <WhatsAppContactButton />
</template>
