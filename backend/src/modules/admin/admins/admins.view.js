export const adminsView = {
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

  formatAdminList(rows) {
    return rows.map((row) => adminsView.formatAdmin(row));
  },
};
