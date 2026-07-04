import { pool } from '../../../config/database.js';

export const paymentsModel = {
  async findPaged({ page = 1, limit = 20, status = null, q = '' }) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];
    let idx = 1;

    if (status) {
      conditions.push(`bt.status = $${idx}`);
      params.push(status);
      idx += 1;
    }

    if (q.trim()) {
      conditions.push(
        `(u.name ILIKE $${idx} OR u.email ILIKE $${idx} OR bt.reference_code ILIKE $${idx} OR bt.sender_name ILIKE $${idx})`,
      );
      params.push(`%${q.trim()}%`);
      idx += 1;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM bank_transfers bt
       JOIN users u ON u.id = bt.user_id
       ${where}`,
      params,
    );
    const total = countRows[0]?.total ?? 0;

    const listParams = [...params, limit, offset];
    const { rows } = await pool.query(
      `SELECT bt.*,
              u.name AS user_name, u.email AS user_email,
              a.name AS reviewer_name
       FROM bank_transfers bt
       JOIN users u ON u.id = bt.user_id
       LEFT JOIN admins a ON a.id = bt.reviewed_by_admin_id
       ${where}
       ORDER BY bt.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      listParams,
    );

    return {
      rows,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  },

  async findById(id) {
    const { rows } = await pool.query(
      `SELECT bt.*,
              u.name AS user_name, u.email AS user_email,
              a.name AS reviewer_name
       FROM bank_transfers bt
       JOIN users u ON u.id = bt.user_id
       LEFT JOIN admins a ON a.id = bt.reviewed_by_admin_id
       WHERE bt.id = $1`,
      [id],
    );
    return rows[0] ?? null;
  },

  async review(id, { status, adminId, adminNotes, invoiceNumber, invoicePdfUrl }) {
    const { rows } = await pool.query(
      `UPDATE bank_transfers
       SET status = $1, reviewed_by_admin_id = $2, reviewed_at = NOW(),
           admin_notes = $3,
           invoice_number = CASE WHEN $1 = 'approved' THEN $5 ELSE invoice_number END,
           invoice_pdf_url = CASE WHEN $1 = 'approved' THEN $6 ELSE invoice_pdf_url END,
           updated_at = NOW()
       WHERE id = $4 AND status = 'pending'
       RETURNING *`,
      [status, adminId, adminNotes ?? null, id, invoiceNumber ?? null, invoicePdfUrl ?? null],
    );
    return rows[0] ?? null;
  },
};
