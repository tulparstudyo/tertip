<script setup>
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { IconBrandWhatsapp } from '@tabler/icons-vue';
import { useSiteConfig } from '@/composables/useSiteConfig.js';
import { buildWhatsAppUrl } from '@/utils/whatsapp.js';
import { tablerIconProps } from '@/constants/icons.js';

defineProps({
  variant: {
    type: String,
    default: 'app',
    validator: (value) => ['app', 'public'].includes(value),
  },
});

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
    class="whatsapp-mobile-nav-link"
    :class="`whatsapp-mobile-nav-link--${variant}`"
    :aria-label="t('common.whatsappContact')"
  >
    <IconBrandWhatsapp v-bind="tablerIconProps.nav" aria-hidden="true" />
    <span v-if="variant === 'public'" class="whatsapp-mobile-nav-link__label">WhatsApp</span>
  </a>
</template>

<style scoped>
.whatsapp-mobile-nav-link {
  @apply flex items-center justify-center text-[#25D366] transition-colors hover:text-[#1ebe57];
}

.whatsapp-mobile-nav-link :deep(svg) {
  @apply w-6 h-6 shrink-0;
}

.whatsapp-mobile-nav-link--app {
  @apply flex-1;
}

.whatsapp-mobile-nav-link--public {
  @apply flex-1 flex-col gap-0.5 px-1 min-w-0;
}

.whatsapp-mobile-nav-link__label {
  @apply text-[10px] leading-tight font-medium truncate max-w-full;
}
</style>
