import dotenv from 'dotenv';
import { pool } from '../src/config/database.js';

dotenv.config();

try {
  const { rows } = await pool.query(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`,
  );
  console.log(rows.length ? rows.map((r) => r.tablename).join(', ') : 'NO TABLES');
} catch (e) {
  console.error('FAIL:', e.message);
} finally {
  await pool.end();
}
