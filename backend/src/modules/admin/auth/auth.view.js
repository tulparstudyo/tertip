export const authView = {
  formatAdmin(row) {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      isActive: row.is_active,
      lastLoginAt: row.last_login_at,
      createdAt: row.created_at,
    };
  },

  formatAuthResponse({ admin, accessToken }) {
    return {
      accessToken,
      admin: authView.formatAdmin(admin),
    };
  },
};
