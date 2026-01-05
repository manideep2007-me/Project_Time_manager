// Check if all fields are stored
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB2_HOST,
  port: process.env.DB2_PORT,
  database: process.env.DB2_NAME,
  user: process.env.DB2_USER,
  password: process.env.DB2_PASSWORD,
});

pool.query('SELECT name, industry, city, state_province, country, zip_code, logo_url FROM organizations_registry ORDER BY created_at DESC LIMIT 1')
  .then(r => {
    console.log('Latest organization data:');
    console.log(r.rows[0]);
    pool.end();
  })
  .catch(e => {
    console.error('Error:', e.message);
    pool.end();
  });
