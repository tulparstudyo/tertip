import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

export const pool = env.databaseUrl
  ? new Pool({
      connectionString: env.databaseUrl,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      ssl: env.databaseSsl,
    })
  : null;

if (pool) {
  pool.on('error', (err) => {
    console.error('Unexpected PostgreSQL pool error', err);
  });
}

export async function testConnection() {
  if (!pool) {
    const err = new Error('health.dbNotConfigured');
    err.status = 503;
    throw err;
  }

  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
  } finally {
    client.release();
  }
}
