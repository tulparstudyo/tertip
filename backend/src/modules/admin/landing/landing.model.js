import { pool } from '../../../config/database.js';
import {
  LANDING_PAGE_KEY,
  getDefaultLandingContent,
  normalizeLandingContent,
} from '../../../shared/services/landing-page.service.js';

export const landingModel = {
  async getContent() {
    const { rows } = await pool.query(
      'SELECT key, value, updated_at FROM system_settings WHERE key = $1',
      [LANDING_PAGE_KEY],
    );
    const row = rows[0];
    if (row?.value) {
      return { content: normalizeLandingContent(row.value), updatedAt: row.updated_at };
    }

    const defaults = getDefaultLandingContent();
    await this.saveContent(defaults);
    return { content: defaults, updatedAt: new Date() };
  },

  async saveContent(content) {
    const normalized = normalizeLandingContent(content);
    const { rows } = await pool.query(
      `INSERT INTO system_settings (key, value, updated_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (key) DO UPDATE
       SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
       RETURNING key, value, updated_at`,
      [LANDING_PAGE_KEY, normalized],
    );
    return {
      content: normalizeLandingContent(rows[0].value),
      updatedAt: rows[0].updated_at,
    };
  },
};
