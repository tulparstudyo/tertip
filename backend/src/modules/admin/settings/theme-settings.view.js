import {
  THEME_ELEMENT_KEYS,
  THEME_GOOGLE_FONTS,
  THEME_SYSTEM_FONTS,
  buildThemeCssVariables,
  collectGoogleFontFamilies,
  normalizeThemeSettings,
} from '../../../shared/services/theme-settings.service.js';

export const themeSettingsView = {
  formatTheme(data) {
    const theme = normalizeThemeSettings(data);
    return {
      theme,
      cssVariables: buildThemeCssVariables(theme),
      fontOptions: {
        google: THEME_GOOGLE_FONTS,
      },
      googleFontFamilies: collectGoogleFontFamilies(theme),
      elementKeys: THEME_ELEMENT_KEYS,
    };
  },
};
