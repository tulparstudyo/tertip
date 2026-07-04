import { pool } from '../../../config/database.js';

function currentMonthStart() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);
}

export const aiModel = {
  async ensureMonthlyQuota(userId) {
    const monthStart = currentMonthStart();
    await pool.query(
      `UPDATE users
       SET ai_commands_used = 0, ai_quota_period_start = $2::date
       WHERE id = $1 AND ai_quota_period_start < $2::date`,
      [userId, monthStart],
    );
  },

  async getQuota(userId) {
    await aiModel.ensureMonthlyQuota(userId);
    const { rows } = await pool.query(
      `SELECT ai_command_quota, ai_commands_used, ai_quota_period_start
       FROM users WHERE id = $1`,
      [userId],
    );
    return rows[0] ?? null;
  },

  async consumeCommand(userId) {
    await aiModel.ensureMonthlyQuota(userId);

    const { rows } = await pool.query(
      `UPDATE users
       SET ai_commands_used = ai_commands_used + 1
       WHERE id = $1 AND ai_commands_used < ai_command_quota
       RETURNING ai_command_quota, ai_commands_used`,
      [userId],
    );

    if (!rows.length) {
      const err = new Error('AI_QUOTA_EXCEEDED');
      err.status = 429;
      throw err;
    }
  },
};
