import { pool } from '../../config/database.js';
import {
  THEME_SETTINGS_KEY,
  getDefaultThemeSettings,
  normalizeThemeSettings,
} from '../services/theme-settings.service.js';

export const themeSettingsModel = {
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

  async getThemeSettings() {
    const row = await this.findByKey(THEME_SETTINGS_KEY);
    if (row?.value) {
      return normalizeThemeSettings(row.value);
    }

    const defaults = getDefaultThemeSettings();
    await this.upsert(THEME_SETTINGS_KEY, defaults);
    return defaults;
  },

  async saveThemeSettings(data) {
    const normalized = normalizeThemeSettings(data);
    const row = await this.upsert(THEME_SETTINGS_KEY, normalized);
    return normalizeThemeSettings(row.value);
  },
};
