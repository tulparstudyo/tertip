import { pool } from '../../config/database.js';

function mapRow(row) {
  return {
    id: row.id,
    settingCode: row.setting_code,
    settingValue: row.setting_value ?? '',
    settingGroup: row.setting_group,
    settingName: row.setting_name,
    updatedAt: row.updated_at,
  };
}

export const settingsModel = {
  async findAll() {
    const { rows } = await pool.query(
      `SELECT id, setting_code, setting_value, setting_group, setting_name, updated_at
       FROM settings
       ORDER BY setting_group, setting_name`,
    );
    return rows.map(mapRow);
  },

  async updateValues(updates) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const results = [];

      for (const { id, settingValue } of updates) {
        const { rows } = await client.query(
          `UPDATE settings
           SET setting_value = $2, updated_at = CURRENT_TIMESTAMP
           WHERE id = $1
           RETURNING id, setting_code, setting_value, setting_group, setting_name, updated_at`,
          [id, settingValue ?? ''],
        );
        if (rows[0]) {
          results.push(mapRow(rows[0]));
        }
      }

      await client.query('COMMIT');
      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
};
