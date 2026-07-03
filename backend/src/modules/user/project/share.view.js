export const shareView = {
  formatShare(row) {
    return {
      id: row.id,
      projectId: row.project_id,
      sharedWithUserId: row.shared_with_user_id,
      email: row.email,
      name: row.name,
      canEdit: row.can_edit,
      createdAt: row.created_at,
    };
  },

  formatShareList(rows) {
    return rows.map((row) => shareView.formatShare(row));
  },
};
