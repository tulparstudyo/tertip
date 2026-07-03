import { pool } from '../../../config/database.js';

export const aiModel = {
  async getQuota(userId) {
    const { rows } = await pool.query(
      `SELECT ai_token_quota, ai_token_used FROM users WHERE id = $1`,
      [userId],
    );
    return rows[0] ?? null;
  },

  async consumeTokens(userId, amount) {
    const quota = await aiModel.getQuota(userId);
    const used = Number(quota?.ai_token_used ?? 0);
    const limit = Number(quota?.ai_token_quota ?? 500_000);

    if (used + amount > limit) {
      const err = new Error('AI_QUOTA_EXCEEDED');
      err.status = 429;
      throw err;
    }

    await pool.query(
      `UPDATE users SET ai_token_used = ai_token_used + $2 WHERE id = $1`,
      [userId, amount],
    );
  },
};
