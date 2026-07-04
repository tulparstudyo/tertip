import { pool } from '../../../config/database.js';

export const aiCommandLogModel = {
  async insert({ userId, projectId, commandType, tokensUsed, status, errorMessage }) {
    const { rows } = await pool.query(
      `INSERT INTO ai_command_logs (user_id, project_id, command_type, tokens_used, status, error_message)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, projectId ?? null, commandType, tokensUsed ?? 0, status, errorMessage ?? null],
    );
    return rows[0];
  },

  async findById(id) {
    const { rows } = await pool.query(
      `SELECT l.*,
              u.name AS user_name, u.email AS user_email,
              p.title AS project_title
       FROM ai_command_logs l
       JOIN users u ON u.id = l.user_id
       LEFT JOIN projects p ON p.id = l.project_id
       WHERE l.id = $1`,
      [id],
    );
    return rows[0] ?? null;
  },

  async findByIdForUser(id, userId) {
    const { rows } = await pool.query(
      `SELECT l.*, p.title AS project_title
       FROM ai_command_logs l
       LEFT JOIN projects p ON p.id = l.project_id
       WHERE l.id = $1 AND l.user_id = $2`,
      [id, userId],
    );
    return rows[0] ?? null;
  },

  async findPaged({
    page = 1,
    limit = 20,
    userId = null,
    projectId = null,
    commandType = null,
    status = null,
    dateFrom = null,
    dateTo = null,
    q = '',
  }) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];
    let idx = 1;

    if (userId) {
      conditions.push(`l.user_id = $${idx}`);
      params.push(userId);
      idx += 1;
    }

    if (projectId) {
      conditions.push(`l.project_id = $${idx}`);
      params.push(projectId);
      idx += 1;
    }

    if (commandType) {
      conditions.push(`l.command_type = $${idx}`);
      params.push(commandType);
      idx += 1;
    }

    if (status === 'success' || status === 'failure') {
      conditions.push(`l.status = $${idx}`);
      params.push(status);
      idx += 1;
    }

    if (dateFrom) {
      conditions.push(`l.created_at >= $${idx}::date`);
      params.push(dateFrom);
      idx += 1;
    }

    if (dateTo) {
      conditions.push(`l.created_at < ($${idx}::date + INTERVAL '1 day')`);
      params.push(dateTo);
      idx += 1;
    }

    if (q.trim()) {
      conditions.push(`(u.name ILIKE $${idx} OR u.email ILIKE $${idx})`);
      params.push(`%${q.trim()}%`);
      idx += 1;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const fromClause = `
      FROM ai_command_logs l
      JOIN users u ON u.id = l.user_id
      LEFT JOIN projects p ON p.id = l.project_id
    `;

    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*)::int AS total ${fromClause} ${where}`,
      params,
    );
    const total = countRows[0]?.total ?? 0;

    const listParams = [...params, limit, offset];
    const { rows } = await pool.query(
      `SELECT l.*,
              u.name AS user_name, u.email AS user_email,
              p.title AS project_title
       ${fromClause}
       ${where}
       ORDER BY l.created_at DESC
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
};
