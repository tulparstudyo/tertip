export const aiLogsView = {
  formatLog(row) {
    return {
      id: row.id,
      userId: row.user_id,
      userName: row.user_name,
      userEmail: row.user_email,
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
    return rows.map((row) => aiLogsView.formatLog(row));
  },
};
