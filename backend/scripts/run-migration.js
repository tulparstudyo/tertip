import { readFileSync, readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { pool } from '../src/config/database.js';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, '..', 'migrations');
const target = process.argv[2];

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .filter((f) => !target || f === target || f.startsWith(target))
  .sort();

if (files.length === 0) {
  console.error('No migration files found.');
  process.exit(1);
}

try {
  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), 'utf-8');
    await pool.query(sql);
    console.log(`Applied: ${file}`);
  }
  console.log('Migrations completed.');
} catch (e) {
  console.error('Migration failed:', e.message);
  process.exit(1);
} finally {
  await pool.end();
}
