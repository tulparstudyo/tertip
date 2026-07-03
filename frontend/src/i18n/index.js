import { createI18n } from 'vue-i18n';
import tr from './tr.json';
import en from './en.json';

const savedLocale = localStorage.getItem('tertip_locale') ?? 'tr';

export const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'tr',
  messages: { tr, en },
});

export function setLocale(locale) {
  i18n.global.locale.value = locale;
  localStorage.setItem('tertip_locale', locale);
}
