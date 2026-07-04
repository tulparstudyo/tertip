import { ref } from 'vue';
import { fetchThemeSettings } from '@/api/public-client.js';
import { applyCssVariablesToRoot } from '@/config/theme-settings.js';
import {
  collectGoogleFontFamilies,
  ensureGoogleFontsPreconnect,
  loadGoogleFonts,
} from '@/utils/google-fonts.js';

const cssVariables = ref({});
const themeLoaded = ref(false);

export function useThemeSettings() {
  async function loadThemeSettings() {
    try {
      ensureGoogleFontsPreconnect();
      const data = await fetchThemeSettings();
      cssVariables.value = data?.cssVariables ?? {};
      applyCssVariablesToRoot(cssVariables.value);
      loadGoogleFonts(data?.googleFontFamilies ?? []);
      themeLoaded.value = true;
    } catch {
      themeLoaded.value = true;
    }
  }

  function applyThemePayload(data) {
    if (!data) return;
    cssVariables.value = data.cssVariables ?? {};
    applyCssVariablesToRoot(cssVariables.value);
    loadGoogleFonts(data.googleFontFamilies ?? collectGoogleFontFamilies(data.theme));
  }

  return {
    cssVariables,
    themeLoaded,
    loadThemeSettings,
    applyThemePayload,
    applyCssVariablesToRoot,
  };
}
