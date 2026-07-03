import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { env } from '../../config/env.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dictionaries = {};

for (const locale of env.supportedLocales) {
  const file = join(__dirname, '..', '..', 'locales', `${locale}.json`);
  dictionaries[locale] = JSON.parse(readFileSync(file, 'utf-8'));
}

function resolveLocale(header) {
  if (!header) return env.defaultLocale;
  const preferred = header.split(',')[0]?.trim().slice(0, 2).toLowerCase();
  return env.supportedLocales.includes(preferred) ? preferred : env.defaultLocale;
}

export function i18nMiddleware(req, res, next) {
  const locale = resolveLocale(req.headers['accept-language']);
  req.locale = locale;
  req.t = (key) =>
    dictionaries[locale]?.[key] ?? dictionaries[env.defaultLocale]?.[key] ?? key;
  next();
}
