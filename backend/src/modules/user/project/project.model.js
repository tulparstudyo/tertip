import { pool } from '../../../config/database.js';
import {
  resolveProjectSectionColumn,
  GOOGLE_DOC_SYNC_ORDER,
} from '../../../shared/constants/project-sections.constants.js';
import { buildDefaultSectionDoc, normalizeSectionDoc } from '../../../shared/constants/project-section-defaults.js';
import { getProjectContext } from '../../../shared/constants/project-metadata.constants.js';

export const projectModel = {
  async findAllByUserId(userId) {
    const { rows } = await pool.query(
      `SELECT DISTINCT p.*,
         (p.user_id = $1) AS is_owner,
         CASE WHEN p.user_id = $1 THEN TRUE ELSE COALESCE(ps.can_edit, FALSE) END AS can_edit
       FROM projects p
       LEFT JOIN project_shares ps
         ON ps.project_id = p.id AND ps.shared_with_user_id = $1
       WHERE p.user_id = $1 OR ps.shared_with_user_id = $1
       ORDER BY p.updated_at DESC`,
      [userId],
    );
    return rows;
  },

  async findByIdAndUserId(projectId, userId) {
    const { rows } = await pool.query(
      `SELECT * FROM projects WHERE id = $1 AND user_id = $2`,
      [projectId, userId],
    );
    return rows[0] ?? null;
  },

  async findAccessibleProject(projectId, userId) {
    const { rows } = await pool.query(
      `SELECT p.*,
         (p.user_id = $2) AS is_owner,
         CASE WHEN p.user_id = $2 THEN TRUE ELSE COALESCE(ps.can_edit, FALSE) END AS can_edit
       FROM projects p
       LEFT JOIN project_shares ps
         ON ps.project_id = p.id AND ps.shared_with_user_id = $2
       WHERE p.id = $1 AND (p.user_id = $2 OR ps.shared_with_user_id = $2)`,
      [projectId, userId],
    );
    const row = rows[0];
    if (!row) return null;

    return {
      project: row,
      isOwner: row.is_owner,
      canEdit: row.can_edit,
    };
  },

  async insert(userId, payload) {
    const { title, projectType, googleDocsFileId, googleDriveFolderId, metadata = {} } = payload;

    const { rows } = await pool.query(
      `INSERT INTO projects (user_id, title, project_type, google_docs_file_id, google_drive_folder_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)
       RETURNING *`,
      [userId, title, projectType, googleDocsFileId, googleDriveFolderId, JSON.stringify(metadata)],
    );

    const project = rows[0];
    if (project) {
      await projectModel.initializeSectionDefaults(project);
    }

    return project;
  },

  async initializeSectionDefaults(project) {
    const context = getProjectContext(project);

    for (const section of GOOGLE_DOC_SYNC_ORDER) {
      const content = buildDefaultSectionDoc(section, context);
      await projectModel.saveSectionContent(project.id, project.user_id, section, content);
    }
  },

  async updateById(projectId, userId, payload) {
    const { title, projectType, metadata } = payload;

    const { rows } = await pool.query(
      `UPDATE projects SET
         title = COALESCE($3, title),
         project_type = COALESCE($4, project_type),
         metadata = COALESCE($5::jsonb, metadata),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [
        projectId,
        userId,
        title ?? null,
        projectType ?? null,
        metadata !== undefined ? JSON.stringify(metadata) : null,
      ],
    );
    return rows[0];
  },

  async deleteById(projectId, userId) {
    const { rowCount } = await pool.query(
      `DELETE FROM projects WHERE id = $1 AND user_id = $2`,
      [projectId, userId],
    );
    return rowCount > 0;
  },

  async updateDriveWorkspace(projectId, userId, { googleDocsFileId, googleDriveFolderId }) {
    const { rows } = await pool.query(
      `UPDATE projects SET
         google_docs_file_id = $3,
         google_drive_folder_id = COALESCE($4, google_drive_folder_id),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [projectId, userId, googleDocsFileId, googleDriveFolderId ?? null],
    );
    return rows[0] ?? null;
  },

  async saveContent(projectId, ownerId, content) {
    return projectModel.saveSectionContent(projectId, ownerId, 'body', content);
  },

  async saveSectionContent(projectId, ownerId, section, content) {
    const column = resolveProjectSectionColumn(section);
    if (!column) return null;

    const { rows } = await pool.query(
      `UPDATE projects SET
         ${column} = $3,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING ${column}, updated_at, google_docs_file_id`,
      [projectId, ownerId, content],
    );
    return rows[0] ?? null;
  },

  getSectionContent(projectRow, section) {
    const column = resolveProjectSectionColumn(section);
    if (!column || !projectRow) return null;
    return normalizeSectionDoc(projectRow[column]);
  },
};
