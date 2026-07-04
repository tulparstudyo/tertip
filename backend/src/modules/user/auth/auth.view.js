export const authView = {
  formatUser(row) {
    const displayName = [row.name, row.last_name].filter(Boolean).join(' ').trim() || row.name;
    return {
      id: row.id,
      name: row.name,
      lastName: row.last_name,
      displayName,
      email: row.email,
      phone: row.phone,
      billingName: row.billing_name,
      taxOffice: row.tax_office,
      billingAddress: row.billing_address,
      emailVerified: Boolean(row.email_verified_at),
      emailVerifiedAt: row.email_verified_at,
      aiCommandQuota: row.ai_command_quota,
      aiCommandsUsed: row.ai_commands_used,
      aiQuotaPeriodStart: row.ai_quota_period_start,
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
