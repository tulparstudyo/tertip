import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { buildKisaltmalarListesiDoc } from '../constants/project-section-defaults.js';

export { buildKisaltmalarListesiDoc };

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULTS_PATH = join(__dirname, '..', '..', '..', 'data', 'standard-abbreviations.json');

export const STANDARD_ABBREVIATIONS_KEY = 'standard_abbreviations';

export function loadStandardAbbreviationsDefaults() {
  const raw = readFileSync(DEFAULTS_PATH, 'utf-8');
  return normalizeStandardAbbreviations(JSON.parse(raw));
}

export function normalizeStandardAbbreviations(raw) {
  const title = String(raw?.title ?? 'KISALTMALAR LİSTESİ').trim() || 'KISALTMALAR LİSTESİ';
  const items = Array.isArray(raw?.items)
    ? raw.items
        .map((item) => ({
          abbreviation: String(item?.abbreviation ?? '').trim(),
          definition: String(item?.definition ?? '').trim(),
        }))
        .filter((item) => item.abbreviation && item.definition)
    : [];

  return { title, items };
}

export function validateStandardAbbreviationsPayload(body) {
  const normalized = normalizeStandardAbbreviations(body);
  if (normalized.items.length === 0) {
    return { valid: false, message: 'itemsRequired' };
  }
  return { valid: true, data: normalized };
}
