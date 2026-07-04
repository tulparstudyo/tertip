export const paymentsView = {
  formatPayment(row) {
    return {
      id: row.id,
      userId: row.user_id,
      userName: row.user_name,
      userEmail: row.user_email,
      amount: Number(row.amount),
      currency: row.currency,
      senderName: row.sender_name,
      bankName: row.bank_name,
      transferDate: row.transfer_date,
      referenceCode: row.reference_code,
      notes: row.notes,
      status: row.status,
      adminNotes: row.admin_notes,
      reviewedByAdminId: row.reviewed_by_admin_id,
      reviewerName: row.reviewer_name,
      reviewedAt: row.reviewed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  formatPaymentList(rows) {
    return rows.map((row) => paymentsView.formatPayment(row));
  },
};
