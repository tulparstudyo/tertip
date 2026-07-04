import { pool } from '../../../config/database.js';

export const adminsModel = {
  async findPaged({ page = 1, limit = 20, q = '' }) {
    const offset = (page - 1) * limit;
    const search = `%${q.trim()}%`;

    const countQuery = q.trim()
      ? `SELECT COUNT(*)::int AS total FROM admins WHERE name ILIKE $1 OR email ILIKE $1`
      : `SELECT COUNT(*)::int AS total FROM admins`;
    const countParams = q.trim() ? [search] : [];
    const { rows: countRows } = await pool.query(countQuery, countParams);
    const total = countRows[0]?.total ?? 0;

    const listQuery = q.trim()
      ? `SELECT id, name, email, role, is_active, last_login_at, created_at
         FROM admins WHERE name ILIKE $1 OR email ILIKE $1
         ORDER BY created_at DESC LIMIT $2 OFFSET $3`
      : `SELECT id, name, email, role, is_active, last_login_at, created_at
         FROM admins ORDER BY created_at DESC LIMIT $1 OFFSET $2`;
    const listParams = q.trim() ? [search, limit, offset] : [limit, offset];
    const { rows } = await pool.query(listQuery, listParams);

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
      `SELECT id, name, email, role, is_active, last_login_at, created_at FROM admins WHERE id = $1`,
      [id],
    );
    return rows[0] ?? null;
  },

  async findByEmail(email) {
    const { rows } = await pool.query(`SELECT * FROM admins WHERE email = $1`, [email]);
    return rows[0] ?? null;
  },

  async create({ name, email, passwordHash, role }) {
    const { rows } = await pool.query(
      `INSERT INTO admins (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, is_active, last_login_at, created_at`,
      [name, email, passwordHash, role],
    );
    return rows[0];
  },

  async update(id, { name, email, role, passwordHash }) {
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
    if (role !== undefined) {
      fields.push(`role = $${idx++}`);
      values.push(role);
    }
    if (passwordHash) {
      fields.push(`password_hash = $${idx++}`);
      values.push(passwordHash);
    }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    const { rows } = await pool.query(
      `UPDATE admins SET ${fields.join(', ')} WHERE id = $${idx}
       RETURNING id, name, email, role, is_active, last_login_at, created_at`,
      values,
    );
    return rows[0] ?? null;
  },

  async setActive(id, isActive) {
    const { rows } = await pool.query(
      `UPDATE admins SET is_active = $1 WHERE id = $2
       RETURNING id, name, email, role, is_active, last_login_at, created_at`,
      [isActive, id],
    );
    return rows[0] ?? null;
  },

  async countActiveSuperAdmins(excludeId = null) {
    const query = excludeId
      ? `SELECT COUNT(*)::int AS total FROM admins WHERE role = 'super_admin' AND is_active = TRUE AND id != $1`
      : `SELECT COUNT(*)::int AS total FROM admins WHERE role = 'super_admin' AND is_active = TRUE`;
    const params = excludeId ? [excludeId] : [];
    const { rows } = await pool.query(query, params);
    return rows[0]?.total ?? 0;
  },
};
