import { pool } from '../../../config/database.js';
import { buildAuthorsDisplay } from '../../../shared/utils/author-citation.util.js';

function normalizeAuthorPayload(payload) {
  const authorFirstName = payload.authorFirstName?.trim() || null;
  const authorLastName = payload.authorLastName?.trim() || null;
  const authors =
    buildAuthorsDisplay({
      authorFirstName,
      authorLastName,
      authors: payload.authors,
    }) ?? null;

  return { authorFirstName, authorLastName, authors };
}

export const libraryModel = {
  async findAllByUserId(userId) {
    const { rows } = await pool.query(
      `SELECT * FROM sources WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId],
    );
    return rows;
  },

  async findPagedByUserId(userId, { page = 1, limit = 20, q = '', sourceType = null } = {}) {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    const offset = (safePage - 1) * safeLimit;

    const params = [userId];
    let where = 'WHERE user_id = $1';

    const trimmedQ = String(q ?? '').trim();
    if (trimmedQ) {
      params.push(`%${trimmedQ}%`);
      const idx = params.length;
      where += ` AND (
        title ILIKE $${idx}
        OR authors ILIKE $${idx}
        OR author_first_name ILIKE $${idx}
        OR author_last_name ILIKE $${idx}
        OR publisher ILIKE $${idx}
        OR publication_place ILIKE $${idx}
      )`;
    }

    if (sourceType) {
      params.push(sourceType);
      where += ` AND source_type = $${params.length}`;
    }

    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*)::int AS total FROM sources ${where}`,
      params,
    );
    const total = countRows[0]?.total ?? 0;

    params.push(safeLimit, offset);
    const { rows } = await pool.query(
      `SELECT * FROM sources ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );

    return {
      rows,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: total > 0 ? Math.ceil(total / safeLimit) : 1,
    };
  },

  async findByIds(userId, ids) {
    const uniqueIds = [...new Set(ids.filter((id) => Number.isFinite(id)))];
    if (!uniqueIds.length) return [];

    const { rows } = await pool.query(
      `SELECT * FROM sources WHERE user_id = $1 AND id = ANY($2::int[]) ORDER BY created_at DESC`,
      [userId, uniqueIds],
    );
    return rows;
  },

  async findByIdAndUserId(sourceId, userId) {
    const { rows } = await pool.query(
      `SELECT * FROM sources WHERE id = $1 AND user_id = $2`,
      [sourceId, userId],
    );
    return rows[0] ?? null;
  },

  async insert(userId, payload) {
    const {
      sourceType,
      title,
      publisher,
      publicationPlace,
      publicationYear,
      volume,
      issue,
      pages,
      googleDriveFileId,
    } = payload;
    const { authorFirstName, authorLastName, authors } = normalizeAuthorPayload(payload);

    const { rows } = await pool.query(
      `INSERT INTO sources
         (user_id, source_type, title, authors, author_first_name, author_last_name, publisher, publication_place, publication_year, volume, issue, pages, google_drive_file_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        userId,
        sourceType,
        title,
        authors,
        authorFirstName,
        authorLastName,
        publisher ?? null,
        publicationPlace ?? null,
        publicationYear ?? null,
        volume ?? null,
        issue ?? null,
        pages ?? null,
        googleDriveFileId ?? null,
      ],
    );
    return rows[0];
  },

  async replaceFromImport(sourceId, userId, payload) {
    const {
      sourceType,
      title,
      publisher,
      publicationPlace,
      publicationYear,
      volume,
      issue,
      pages,
    } = payload;
    const { authorFirstName, authorLastName, authors } = normalizeAuthorPayload(payload);

    const { rows } = await pool.query(
      `UPDATE sources SET
         source_type = $3,
         title = $4,
         authors = $5,
         author_first_name = $6,
         author_last_name = $7,
         publisher = $8,
         publication_place = $9,
         publication_year = $10,
         volume = $11,
         issue = $12,
         pages = $13
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [
        sourceId,
        userId,
        sourceType,
        title,
        authors,
        authorFirstName,
        authorLastName,
        publisher ?? null,
        publicationPlace ?? null,
        publicationYear ?? null,
        volume ?? null,
        issue ?? null,
        pages ?? null,
      ],
    );
    return rows[0];
  },

  async updateById(sourceId, userId, payload) {
    const {
      sourceType,
      title,
      publisher,
      publicationPlace,
      publicationYear,
      volume,
      issue,
      pages,
      googleDriveFileId,
    } = payload;
    const authorFields = normalizeAuthorPayload(payload);

    const { rows } = await pool.query(
      `UPDATE sources SET
         source_type = COALESCE($3, source_type),
         title = COALESCE($4, title),
         authors = COALESCE($5, authors),
         author_first_name = COALESCE($6, author_first_name),
         author_last_name = COALESCE($7, author_last_name),
         publisher = COALESCE($8, publisher),
         publication_place = COALESCE($9, publication_place),
         publication_year = COALESCE($10, publication_year),
         volume = COALESCE($11, volume),
         issue = COALESCE($12, issue),
         pages = COALESCE($13, pages),
         google_drive_file_id = COALESCE($14, google_drive_file_id)
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [
        sourceId,
        userId,
        sourceType,
        title,
        authorFields.authors,
        authorFields.authorFirstName,
        authorFields.authorLastName,
        publisher,
        publicationPlace,
        publicationYear,
        volume,
        issue,
        pages,
        googleDriveFileId,
      ],
    );
    return rows[0];
  },

  async deleteById(sourceId, userId) {
    const { rowCount } = await pool.query(
      `DELETE FROM sources WHERE id = $1 AND user_id = $2`,
      [sourceId, userId],
    );
    return rowCount > 0;
  },
};
