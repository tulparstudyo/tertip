<script setup>
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { IconBrandWhatsapp } from '@tabler/icons-vue';
import { useSiteConfig } from '@/composables/useSiteConfig.js';
import { buildWhatsAppUrl } from '@/utils/whatsapp.js';
import { tablerIconProps } from '@/constants/icons.js';

const { t } = useI18n();
const { whatsappNumber, hasWhatsApp, loadSiteConfig } = useSiteConfig();

const whatsappUrl = computed(() => (
  buildWhatsAppUrl(whatsappNumber.value, t('common.whatsappDefaultMessage'))
));

onMounted(() => {
  void loadSiteConfig();
});
</script>

<template>
  <a
    v-if="hasWhatsApp && whatsappUrl"
    :href="whatsappUrl"
    target="_blank"
    rel="noopener noreferrer"
    class="whatsapp-contact-btn"
    :title="t('common.whatsappContact')"
    :aria-label="t('common.whatsappContact')"
  >
    <IconBrandWhatsapp v-bind="tablerIconProps.nav" aria-hidden="true" />
  </a>
</template>

<style scoped>
.whatsapp-contact-btn {
  @apply fixed z-50 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg hover:bg-[#1ebe57] transition-colors;
  display: none;
  bottom: 1.5rem;
  right: 1.5rem;
  width: 3rem;
  height: 3rem;
}

@media (min-width: 640px) {
  .whatsapp-contact-btn {
    display: inline-flex;
  }
}

.whatsapp-contact-btn :deep(svg) {
  @apply w-6 h-6 shrink-0;
}
</style>
