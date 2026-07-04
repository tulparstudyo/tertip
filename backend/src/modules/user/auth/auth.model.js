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

  async updateProfile(userId, {
    name,
    lastName,
    phone,
    billingName,
    taxOffice,
    billingAddress,
  }) {
    const { rows } = await pool.query(
      `UPDATE users
       SET name = $2,
           last_name = $3,
           phone = $4,
           billing_name = $5,
           tax_office = $6,
           billing_address = $7
       WHERE id = $1
       RETURNING *`,
      [
        userId,
        name,
        lastName ?? null,
        phone ?? null,
        billingName ?? null,
        taxOffice ?? null,
        billingAddress ?? null,
      ],
    );
    return rows[0] ?? null;
  },

  async updatePassword(userId, passwordHash) {
    await pool.query(`UPDATE users SET password_hash = $2 WHERE id = $1`, [userId, passwordHash]);
  },

  async invalidateSessionsForDevice(userId, deviceId) {
    await pool.query(
      `UPDATE user_sessions SET is_valid = FALSE
       WHERE user_id = $1 AND device_id = $2 AND is_valid = TRUE`,
      [userId, deviceId],
    );
  },

  async invalidateAllSessions(userId) {
    await pool.query(
      `UPDATE user_sessions SET is_valid = FALSE WHERE user_id = $1 AND is_valid = TRUE`,
      [userId],
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

  async invalidatePasswordResetTokens(userId) {
    await pool.query(
      `UPDATE password_reset_tokens SET used_at = NOW()
       WHERE user_id = $1 AND used_at IS NULL`,
      [userId],
    );
  },

  async createPasswordResetToken(userId, tokenHash) {
    await authModel.invalidatePasswordResetTokens(userId);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + env.passwordResetExpiresHours);

    const { rows } = await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, tokenHash, expiresAt],
    );
    return rows[0];
  },

  async findValidPasswordResetToken(tokenHash) {
    const { rows } = await pool.query(
      `SELECT prt.*, u.email, u.is_active
       FROM password_reset_tokens prt
       JOIN users u ON u.id = prt.user_id
       WHERE prt.token_hash = $1
         AND prt.used_at IS NULL
         AND prt.expires_at > NOW()`,
      [tokenHash],
    );
    return rows[0] ?? null;
  },

  async markPasswordResetTokenUsed(id) {
    await pool.query(
      `UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1`,
      [id],
    );
  },

  async invalidateEmailVerificationTokens(userId) {
    await pool.query(
      `UPDATE email_verification_tokens SET used_at = NOW()
       WHERE user_id = $1 AND used_at IS NULL`,
      [userId],
    );
  },

  async createEmailVerificationToken(userId, tokenHash) {
    await authModel.invalidateEmailVerificationTokens(userId);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + env.emailVerificationExpiresHours);

    const { rows } = await pool.query(
      `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, tokenHash, expiresAt],
    );
    return rows[0];
  },

  async findValidEmailVerificationToken(tokenHash) {
    const { rows } = await pool.query(
      `SELECT evt.*, u.email, u.is_active, u.email_verified_at
       FROM email_verification_tokens evt
       JOIN users u ON u.id = evt.user_id
       WHERE evt.token_hash = $1
         AND evt.used_at IS NULL
         AND evt.expires_at > NOW()`,
      [tokenHash],
    );
    return rows[0] ?? null;
  },

  async markEmailVerificationTokenUsed(id) {
    await pool.query(
      `UPDATE email_verification_tokens SET used_at = NOW() WHERE id = $1`,
      [id],
    );
  },

  async markEmailVerified(userId) {
    const { rows } = await pool.query(
      `UPDATE users SET email_verified_at = NOW() WHERE id = $1
       RETURNING *`,
      [userId],
    );
    return rows[0] ?? null;
  },
};
