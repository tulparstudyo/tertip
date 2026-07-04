export const paymentsView = {
  formatPayment(row) {
    return {
      id: row.id,
      amount: Number(row.amount),
      currency: row.currency,
      senderName: row.sender_name,
      bankName: row.bank_name,
      transferDate: row.transfer_date,
      referenceCode: row.reference_code,
      notes: row.notes,
      status: row.status,
      adminNotes: row.admin_notes,
      reviewedAt: row.reviewed_at,
      createdAt: row.created_at,
    };
  },

  formatPaymentList(rows) {
    return rows.map((row) => paymentsView.formatPayment(row));
  },
};
