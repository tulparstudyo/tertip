import { pool } from '../../../config/database.js';
import { env } from '../../../config/env.js';

export const authModel = {
  async findByEmail(email) {
    const { rows } = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
    return rows[0] ?? null;
  },

  async findById(id) {
    const { rows } = await pool.query(`SELECT * FROM users WHERE id = $1`, [id]);
    return rows[0] ?? null;
  },

  async createUser({ name, email, passwordHash }) {
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, email, passwordHash],
    );
    return rows[0];
  },

  async invalidateSessionsForDevice(userId, deviceId) {
    await pool.query(
      `UPDATE user_sessions SET is_valid = FALSE
       WHERE user_id = $1 AND device_id = $2 AND is_valid = TRUE`,
      [userId, deviceId],
    );
  },

  async createSession({ userId, deviceId, refreshToken }) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + env.jwtRefreshExpiresDays);

    const { rows } = await pool.query(
      `INSERT INTO user_sessions (user_id, device_id, refresh_token, expires_at)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, deviceId, refreshToken, expiresAt],
    );
    return rows[0];
  },

  async findValidSession(userId, deviceId) {
    const { rows } = await pool.query(
      `SELECT * FROM user_sessions
       WHERE user_id = $1 AND device_id = $2 AND is_valid = TRUE AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId, deviceId],
    );
    return rows[0] ?? null;
  },

  async findSessionByRefreshToken(refreshToken) {
    const { rows } = await pool.query(
      `SELECT * FROM user_sessions
       WHERE refresh_token = $1 AND is_valid = TRUE AND expires_at > NOW()`,
      [refreshToken],
    );
    return rows[0] ?? null;
  },

  async invalidateSessionByRefreshToken(refreshToken) {
    const { rowCount } = await pool.query(
      `UPDATE user_sessions SET is_valid = FALSE WHERE refresh_token = $1`,
      [refreshToken],
    );
    return rowCount > 0;
  },
};
