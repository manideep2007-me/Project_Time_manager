const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'project_time_manager',
  user: process.env.DB_USER || 'postgres',
  password: String(process.env.DB_PASSWORD || ''),
});

console.log('Attempting connection with:');
console.log('Host:', process.env.DB_HOST);
console.log('Port:', process.env.DB_PORT);
console.log('Database:', process.env.DB_NAME);
console.log('User:', process.env.DB_USER);
console.log('Password length:', process.env.DB_PASSWORD?.length);

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Connection failed:', err.message);
    process.exit(1);
  }
  console.log('✓ Connection successful!');
  console.log('Current time from DB:', res.rows[0].now);
  pool.end();
});
