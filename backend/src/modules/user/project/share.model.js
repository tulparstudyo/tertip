import { pool } from '../../../config/database.js';

export const shareModel = {
  async findByProjectId(projectId) {
    const { rows } = await pool.query(
      `SELECT ps.*, u.email, u.name
       FROM project_shares ps
       JOIN users u ON u.id = ps.shared_with_user_id
       WHERE ps.project_id = $1
       ORDER BY ps.created_at DESC`,
      [projectId],
    );
    return rows;
  },

  async create({ projectId, sharedByUserId, sharedWithUserId }) {
    const { rows } = await pool.query(
      `INSERT INTO project_shares (project_id, shared_by_user_id, shared_with_user_id, can_edit)
       VALUES ($1, $2, $3, FALSE)
       ON CONFLICT (project_id, shared_with_user_id) DO NOTHING
       RETURNING *`,
      [projectId, sharedByUserId, sharedWithUserId],
    );
    return rows[0] ?? null;
  },

  async deleteShare(projectId, shareId, ownerId) {
    const { rowCount } = await pool.query(
      `DELETE FROM project_shares ps
       USING projects p
       WHERE ps.id = $1 AND ps.project_id = $2 AND p.id = ps.project_id AND p.user_id = $3`,
      [shareId, projectId, ownerId],
    );
    return rowCount > 0;
  },

  async findUserByEmail(email) {
    const { rows } = await pool.query(`SELECT id, email, name FROM users WHERE email = $1`, [
      email.toLowerCase(),
    ]);
    return rows[0] ?? null;
  },
};
