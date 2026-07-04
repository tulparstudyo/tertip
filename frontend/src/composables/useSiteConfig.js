import { ref, computed } from 'vue';
import { fetchSiteConfig } from '@/api/public-client';
import { normalizeWhatsAppNumber } from '@/utils/whatsapp.js';

const siteConfig = ref({
  whatsappNumber: null,
  loaded: false,
});

let loadPromise = null;

export function useSiteConfig() {
  const whatsappNumber = computed(() => siteConfig.value.whatsappNumber);
  const hasWhatsApp = computed(() => Boolean(normalizeWhatsAppNumber(siteConfig.value.whatsappNumber)));
  const siteConfigLoaded = computed(() => siteConfig.value.loaded);

  async function loadSiteConfig() {
    if (siteConfig.value.loaded) return;
    if (loadPromise) return loadPromise;

    loadPromise = (async () => {
      try {
        const data = await fetchSiteConfig();
        siteConfig.value.whatsappNumber = data?.whatsappNumber ?? null;
      } catch {
        siteConfig.value.whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER ?? null;
      } finally {
        siteConfig.value.loaded = true;
        loadPromise = null;
      }
    })();

    return loadPromise;
  }

  return {
    whatsappNumber,
    hasWhatsApp,
    siteConfigLoaded,
    loadSiteConfig,
  };
}
