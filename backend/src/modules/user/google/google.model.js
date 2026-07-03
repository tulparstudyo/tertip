import { pool } from '../../../config/database.js';

export const googleModel = {
  async getOAuthToken(userId) {
    const { rows } = await pool.query(
      `SELECT google_oauth_token FROM users WHERE id = $1`,
      [userId],
    );
    return rows[0]?.google_oauth_token ?? null;
  },

  async saveOAuthToken(userId, tokenData) {
    await pool.query(`UPDATE users SET google_oauth_token = $2 WHERE id = $1`, [
      userId,
      tokenData,
    ]);
  },

  async clearOAuthToken(userId) {
    await pool.query(`UPDATE users SET google_oauth_token = NULL WHERE id = $1`, [userId]);
  },
};
