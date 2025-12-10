// Quick check of Alice and permissions setup
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'project_time_manager',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
});

async function quickCheck() {
  try {
    // Check Alice
    const alice = await pool.query(
      'SELECT id, email, role FROM users WHERE email = $1',
      ['alice@company.com']
    );
    
    console.log('\n👤 Alice User:');
    console.log('   Email:', alice.rows[0].email);
    console.log('   Role:', alice.rows[0].role);
    console.log('   ID:', alice.rows[0].id);
    
    // Check what roles can access permissions
    console.log('\n🔐 Permissions endpoint should allow: [admin, manager]');
    console.log('   Alice role:', alice.rows[0].role);
    console.log('   Can access?', ['admin', 'manager'].includes(alice.rows[0].role) ? '✅ YES' : '❌ NO - THIS IS THE PROBLEM!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

quickCheck();
