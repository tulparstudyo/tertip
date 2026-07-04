export const aiView = {
  formatLog(row) {
    return {
      id: row.id,
      projectId: row.project_id,
      projectTitle: row.project_title,
      commandType: row.command_type,
      tokensUsed: row.tokens_used,
      status: row.status,
      errorMessage: row.error_message,
      createdAt: row.created_at,
    };
  },

  formatLogList(rows) {
    return rows.map((row) => aiView.formatLog(row));
  },
};
