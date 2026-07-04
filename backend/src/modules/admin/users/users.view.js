export const usersView = {
  formatUser(row) {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      isActive: row.is_active,
      aiCommandQuota: row.ai_command_quota,
      aiCommandsUsed: row.ai_commands_used,
      aiQuotaPeriodStart: row.ai_quota_period_start,
      projectCount: row.project_count ?? undefined,
      createdAt: row.created_at,
    };
  },

  formatUserList(rows) {
    return rows.map((row) => usersView.formatUser(row));
  },
};
