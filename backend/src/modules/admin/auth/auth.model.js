import { pool } from '../../../config/database.js';

export const authModel = {
  async findByEmail(email) {
    const { rows } = await pool.query(`SELECT * FROM admins WHERE email = $1`, [email]);
    return rows[0] ?? null;
  },

  async findById(id) {
    const { rows } = await pool.query(`SELECT * FROM admins WHERE id = $1`, [id]);
    return rows[0] ?? null;
  },

  async updateLastLogin(id) {
    await pool.query(`UPDATE admins SET last_login_at = NOW() WHERE id = $1`, [id]);
  },
};
