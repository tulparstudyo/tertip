import { pool } from '../../../config/database.js';

export const commentModel = {
  async findByProjectId(projectId) {
    const { rows } = await pool.query(
      `SELECT c.*, u.name AS user_name
       FROM project_comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.project_id = $1
       ORDER BY c.created_at ASC`,
      [projectId],
    );
    return rows;
  },

  async insert({ projectId, userId, tiptapCommentId, commentText, lineNumber, columnOffset }) {
    const { rows } = await pool.query(
      `INSERT INTO project_comments
         (project_id, user_id, tiptap_comment_id, comment_text, line_number, column_offset)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [projectId, userId, tiptapCommentId, commentText, lineNumber, columnOffset],
    );
    return rows[0];
  },

  async resolve(commentId, projectId) {
    const { rows } = await pool.query(
      `UPDATE project_comments SET is_resolved = TRUE
       WHERE id = $1 AND project_id = $2
       RETURNING *`,
      [commentId, projectId],
    );
    return rows[0] ?? null;
  },
};
