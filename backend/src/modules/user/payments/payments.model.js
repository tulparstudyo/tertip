import { pool } from '../../../config/database.js';

export const bankTransferModel = {
  async create({ userId, amount, currency, senderName, bankName, transferDate, referenceCode, notes }) {
    const { rows } = await pool.query(
      `INSERT INTO bank_transfers
         (user_id, amount, currency, sender_name, bank_name, transfer_date, reference_code, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        userId,
        amount,
        currency ?? 'TRY',
        senderName ?? null,
        bankName ?? null,
        transferDate ?? null,
        referenceCode ?? null,
        notes ?? null,
      ],
    );
    return rows[0];
  },

  async findPagedByUserId(userId, { page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;

    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*)::int AS total FROM bank_transfers WHERE user_id = $1`,
      [userId],
    );
    const total = countRows[0]?.total ?? 0;

    const { rows } = await pool.query(
      `SELECT * FROM bank_transfers WHERE user_id = $1
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
    );

    return {
      rows,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  },

  async findByIdForUser(id, userId) {
    const { rows } = await pool.query(
      `SELECT * FROM bank_transfers WHERE id = $1 AND user_id = $2`,
      [id, userId],
    );
    return rows[0] ?? null;
  },
};
