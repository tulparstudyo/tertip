import { pool } from '../../config/database.js';
import {
  STANDARD_ABBREVIATIONS_KEY,
  loadStandardAbbreviationsDefaults,
  normalizeStandardAbbreviations,
} from '../../shared/services/standard-abbreviations.service.js';

export const standardAbbreviationsModel = {
  async findByKey(key) {
    const { rows } = await pool.query(
      'SELECT key, value, updated_at FROM system_settings WHERE key = $1',
      [key],
    );
    return rows[0] ?? null;
  },

  async upsert(key, value) {
    const { rows } = await pool.query(
      `INSERT INTO system_settings (key, value, updated_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (key) DO UPDATE
       SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
       RETURNING key, value, updated_at`,
      [key, value],
    );
    return rows[0];
  },

  async getStandardAbbreviations() {
    const row = await this.findByKey(STANDARD_ABBREVIATIONS_KEY);
    if (row?.value) {
      return normalizeStandardAbbreviations(row.value);
    }

    const defaults = loadStandardAbbreviationsDefaults();
    await this.upsert(STANDARD_ABBREVIATIONS_KEY, defaults);
    return defaults;
  },

  async saveStandardAbbreviations(data) {
    const normalized = normalizeStandardAbbreviations(data);
    const row = await this.upsert(STANDARD_ABBREVIATIONS_KEY, normalized);
    return normalizeStandardAbbreviations(row.value);
  },
};
