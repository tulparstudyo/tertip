export const projectView = {
  formatProject(row) {
    return {
      id: row.id,
      title: row.title,
      projectType: row.project_type,
      metadata: row.metadata ?? {},
      googleDocsFileId: row.google_docs_file_id,
      googleDriveFolderId: row.google_drive_folder_id,
      isOwner: row.is_owner ?? true,
      canEdit: row.can_edit ?? true,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  formatProjectList(rows) {
    return rows.map((row) => projectView.formatProject(row));
  },
};
