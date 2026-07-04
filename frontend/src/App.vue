<script setup>
import { onMounted } from 'vue';
import { RouterView } from 'vue-router';
import ToastContainer from '@/components/ToastContainer.vue';
import WhatsAppContactButton from '@/components/WhatsAppContactButton.vue';
import { useSiteConfig } from '@/composables/useSiteConfig.js';

const { loadSiteConfig } = useSiteConfig();

onMounted(() => {
  void loadSiteConfig();
});
</script>

<template>
  <RouterView />
  <ToastContainer />
  <WhatsAppContactButton />
</template>
