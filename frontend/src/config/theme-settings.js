/** Admin tema formu alan tanımları */

import {
  formatFontFamilyCss,
  loadGoogleFonts,
  collectGoogleFontFamilies,
  ensureGoogleFontsPreconnect,
} from '@/utils/google-fonts.js';

export {
  formatFontFamilyCss,
  loadGoogleFonts,
  collectGoogleFontFamilies,
  ensureGoogleFontsPreconnect,
};

export const THEME_COLOR_KEYS = [
  'primary',
  'secondary',
  'accent',
  'background',
  'surface',
  'text',
  'textMuted',
  'border',
  'success',
  'danger',
];

export const THEME_ELEMENT_KEYS = ['body', 'p', 'h1', 'h2', 'h3', 'button'];

export const THEME_FONT_WEIGHT_OPTIONS = ['400', '500', '600', '700', '800'];

export const THEME_ELEMENT_FIELDS = {
  body: ['fontSize', 'color', 'backgroundColor', 'lineHeight'],
  p: ['fontSize', 'fontWeight', 'color', 'lineHeight', 'marginBottom', 'letterSpacing'],
  h1: ['fontSize', 'fontWeight', 'color', 'lineHeight', 'marginBottom', 'letterSpacing'],
  h2: ['fontSize', 'fontWeight', 'color', 'lineHeight', 'marginBottom', 'letterSpacing'],
  h3: ['fontSize', 'fontWeight', 'color', 'lineHeight', 'marginBottom', 'letterSpacing'],
  button: [
    'fontSize',
    'fontWeight',
    'color',
    'backgroundColor',
    'lineHeight',
    'borderRadius',
    'paddingX',
    'paddingY',
    'letterSpacing',
  ],
};

export const THEME_FIELD_TYPES = {
  fontFamily: 'font',
  fontSize: 'size',
  fontWeight: 'weight',
  color: 'color',
  backgroundColor: 'color',
  lineHeight: 'text',
  letterSpacing: 'text',
  marginBottom: 'size',
  borderRadius: 'size',
  paddingX: 'size',
  paddingY: 'size',
};

export function buildElementPreviewStyle(elementKey, styles, googleFont = '') {
  if (!styles) return {};
  const css = {};
  if (googleFont) {
    css.fontFamily = formatFontFamilyCss(googleFont);
  }
  const map = {
    fontSize: 'fontSize',
    fontWeight: 'fontWeight',
    color: 'color',
    backgroundColor: 'backgroundColor',
    lineHeight: 'lineHeight',
    letterSpacing: 'letterSpacing',
    marginBottom: 'marginBottom',
    borderRadius: 'borderRadius',
  };
  for (const [key, cssKey] of Object.entries(map)) {
    if (!styles[key]) continue;
    css[cssKey] = styles[key];
  }
  if (elementKey === 'button' && (styles.paddingX || styles.paddingY)) {
    css.padding = `${styles.paddingY || '0.625rem'} ${styles.paddingX || '1.25rem'}`;
  }
  return css;
}

export function applyCssVariablesToRoot(cssVariables) {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(cssVariables ?? {})) {
    root.style.setProperty(key, value);
  }
}
