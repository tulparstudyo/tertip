import 'dotenv/config';
import { hashPassword } from '../src/shared/utils/password.util.js';
import { pool } from '../src/config/database.js';

const [name, email, password, role = 'super_admin'] = process.argv.slice(2);

if (!name || !email || !password) {
  console.error('Usage: node scripts/seed-admin.js "Name" "email@example.com" "password" [role]');
  process.exit(1);
}

const passwordHash = await hashPassword(password);

const { rows } = await pool.query(
  `INSERT INTO admins (name, email, password_hash, role)
   VALUES ($1, $2, $3, $4::admin_role_type)
   ON CONFLICT (email) DO NOTHING
   RETURNING id, email, role`,
  [name, email.toLowerCase(), passwordHash, role],
);

if (rows.length === 0) {
  console.log('Admin already exists:', email);
} else {
  console.log('Admin created:', rows[0]);
}

await pool.end();
