import { pool } from '../../../config/database.js';

export const usersModel = {
  async findPaged({ page = 1, limit = 20, q = '', isActive = null }) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];
    let idx = 1;

    if (q.trim()) {
      conditions.push(`(u.name ILIKE $${idx} OR u.email ILIKE $${idx})`);
      params.push(`%${q.trim()}%`);
      idx += 1;
    }

    if (isActive === true || isActive === false) {
      conditions.push(`u.is_active = $${idx}`);
      params.push(isActive);
      idx += 1;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*)::int AS total FROM users u ${where}`,
      params,
    );
    const total = countRows[0]?.total ?? 0;

    const listParams = [...params, limit, offset];
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email, u.is_active,
              u.ai_command_quota, u.ai_commands_used, u.ai_quota_period_start, u.created_at,
              (SELECT COUNT(*)::int FROM projects p WHERE p.user_id = u.id) AS project_count
       FROM users u ${where}
       ORDER BY u.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      listParams,
    );

    return {
      rows,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  },

  async findById(id) {
    const { rows } = await pool.query(
      `SELECT id, name, email, is_active,
              ai_command_quota, ai_commands_used, ai_quota_period_start, created_at
       FROM users WHERE id = $1`,
      [id],
    );
    return rows[0] ?? null;
  },

  async findByEmail(email) {
    const { rows } = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
    return rows[0] ?? null;
  },

  async create({ name, email, passwordHash, aiCommandQuota }) {
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, ai_command_quota, email_verified_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, name, email, is_active,
                 ai_command_quota, ai_commands_used, ai_quota_period_start, created_at`,
      [name, email, passwordHash, aiCommandQuota ?? 100],
    );
    return rows[0];
  },

  async update(id, { name, email, passwordHash, aiCommandQuota }) {
    const fields = [];
    const values = [];
    let idx = 1;

    if (name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(name);
    }
    if (email !== undefined) {
      fields.push(`email = $${idx++}`);
      values.push(email);
    }
    if (passwordHash) {
      fields.push(`password_hash = $${idx++}`);
      values.push(passwordHash);
    }
    if (aiCommandQuota !== undefined) {
      fields.push(`ai_command_quota = $${idx++}`);
      values.push(aiCommandQuota);
    }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    const { rows } = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx}
       RETURNING id, name, email, is_active,
                 ai_command_quota, ai_commands_used, ai_quota_period_start, created_at`,
      values,
    );
    return rows[0] ?? null;
  },

  async setActive(id, isActive) {
    const { rows } = await pool.query(
      `UPDATE users SET is_active = $1 WHERE id = $2
       RETURNING id, name, email, is_active,
                 ai_command_quota, ai_commands_used, ai_quota_period_start, created_at`,
      [isActive, id],
    );
    return rows[0] ?? null;
  },

  async invalidateSessions(userId) {
    await pool.query(
      `UPDATE user_sessions SET is_valid = FALSE WHERE user_id = $1 AND is_valid = TRUE`,
      [userId],
    );
  },
};
