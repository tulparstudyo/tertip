import { pool } from '../../../config/database.js';

export const commentModel = {
  async findByProjectId(projectId, sectionSlug = null) {
    const params = [projectId];
    let sectionFilter = '';

    if (sectionSlug) {
      params.push(sectionSlug);
      sectionFilter = ' AND c.section_slug = $2';
    }

    const { rows } = await pool.query(
      `SELECT c.*, u.name AS user_name
       FROM project_comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.project_id = $1${sectionFilter}
       ORDER BY c.created_at ASC`,
      params,
    );
    return rows;
  },

  async insert({
    projectId,
    userId,
    tiptapCommentId,
    commentText,
    lineNumber,
    columnOffset,
    sectionSlug = 'body',
  }) {
    const { rows } = await pool.query(
      `INSERT INTO project_comments
         (project_id, user_id, tiptap_comment_id, comment_text, line_number, column_offset, section_slug)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [projectId, userId, tiptapCommentId, commentText, lineNumber, columnOffset, sectionSlug],
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

  async findByIdAndProject(commentId, projectId) {
    const { rows } = await pool.query(
      `SELECT c.*, u.name AS user_name
       FROM project_comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.id = $1 AND c.project_id = $2`,
      [commentId, projectId],
    );
    return rows[0] ?? null;
  },

  async deleteById(commentId, projectId) {
    const { rows } = await pool.query(
      `DELETE FROM project_comments
       WHERE id = $1 AND project_id = $2
       RETURNING *`,
      [commentId, projectId],
    );
    return rows[0] ?? null;
  },

  async updatePositions(projectId, sectionSlug, positions) {
    if (!positions?.length) return [];

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const updated = [];
      for (const item of positions) {
        const commentId = Number(item.commentId);
        const lineNumber = Number(item.lineNumber);
        const columnOffset = Number(item.columnOffset);
        if (!Number.isFinite(commentId) || !Number.isFinite(lineNumber) || !Number.isFinite(columnOffset)) {
          continue;
        }
        const { rows } = await client.query(
          `UPDATE project_comments
           SET line_number = $3, column_offset = $4
           WHERE id = $1 AND project_id = $2 AND section_slug = $5
           RETURNING *`,
          [commentId, projectId, lineNumber, columnOffset, sectionSlug],
        );
        if (rows[0]) updated.push(rows[0]);
      }
      await client.query('COMMIT');
      return updated;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async updateDriveCommentId(commentId, projectId, googleDriveCommentId) {
    await pool.query(
      `UPDATE project_comments
       SET google_drive_comment_id = $3
       WHERE id = $1 AND project_id = $2`,
      [commentId, projectId, googleDriveCommentId],
    );
  },
};
