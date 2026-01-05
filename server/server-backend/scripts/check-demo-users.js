// Check demo users in project_time_manager
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function check() {
  try {
    const result = await pool.query('SELECT email, first_name, last_name, role FROM users ORDER BY role, email');
    console.log('Demo users in project_time_manager (users table):');
    console.table(result.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

check();
