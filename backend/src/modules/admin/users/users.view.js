export const usersView = {
  formatUser(row) {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      isActive: row.is_active,
      aiTokenQuota: row.ai_token_quota,
      aiTokenUsed: row.ai_token_used,
      projectCount: row.project_count ?? undefined,
      createdAt: row.created_at,
    };
  },

  formatUserList(rows) {
    return rows.map((row) => usersView.formatUser(row));
  },
};
