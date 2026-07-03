export const authView = {
  formatUser(row) {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      isActive: row.is_active,
      aiTokenQuota: row.ai_token_quota,
      aiTokenUsed: row.ai_token_used,
      createdAt: row.created_at,
    };
  },

  formatAuthResponse({ user, accessToken, refreshToken }) {
    return {
      accessToken,
      refreshToken,
      user: authView.formatUser(user),
    };
  },
};
