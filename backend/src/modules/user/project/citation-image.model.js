import { pool } from '../../../config/database.js';

export const citationImageModel = {
  async insert({
    projectId,
    userId,
    sourceId,
    googleDriveFileId,
    ocrText,
    citationText,
    pageNumber,
    mimeType,
    originalFilename,
  }) {
    const { rows } = await pool.query(
      `INSERT INTO citation_images
         (project_id, user_id, source_id, google_drive_file_id, ocr_text, citation_text, page_number, mime_type, original_filename)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        projectId,
        userId,
        sourceId ?? null,
        googleDriveFileId,
        ocrText ?? '',
        citationText ?? '',
        pageNumber ?? null,
        mimeType,
        originalFilename ?? null,
      ],
    );
    return rows[0];
  },

  async findByIdAndProject(id, projectId, userId) {
    const { rows } = await pool.query(
      `SELECT * FROM citation_images
       WHERE id = $1 AND project_id = $2 AND user_id = $3`,
      [id, projectId, userId],
    );
    return rows[0] ?? null;
  },

  async updateById(id, projectId, userId, { sourceId, ocrText, citationText, pageNumber }) {
    const { rows } = await pool.query(
      `UPDATE citation_images SET
         source_id = COALESCE($4, source_id),
         ocr_text = COALESCE($5, ocr_text),
         citation_text = COALESCE($6, citation_text),
         page_number = COALESCE($7, page_number),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND project_id = $2 AND user_id = $3
       RETURNING *`,
      [id, projectId, userId, sourceId, ocrText, citationText, pageNumber],
    );
    return rows[0] ?? null;
  },

  async deleteById(id, projectId, userId) {
    const { rows } = await pool.query(
      `DELETE FROM citation_images
       WHERE id = $1 AND project_id = $2 AND user_id = $3
       RETURNING *`,
      [id, projectId, userId],
    );
    return rows[0] ?? null;
  },
};
