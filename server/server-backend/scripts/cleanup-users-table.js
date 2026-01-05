// Clean up users table - keep only demo accounts
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

// Demo accounts to KEEP (these are for development testing)
const demoEmails = [
  'admin@company.com',    // Admin demo
  'rajesh@company.com',   // Manager demo
  'alice@company.com',    // Employee demo
  'bob@company.com',      // Employee demo
  'charlie@company.com',  // Employee demo
  'diana@company.com',    // Employee demo
  'ethan@company.com',    // Employee demo
  'fiona@company.com',    // Employee demo
];

async function cleanup() {
  try {
    // Show what will be deleted
    const toDelete = await pool.query(
      `SELECT email, first_name, last_name, role FROM users WHERE email NOT IN (${demoEmails.map((_, i) => `$${i + 1}`).join(', ')})`,
      demoEmails
    );
    
    console.log('Users to be REMOVED from users table (real org admins - they are in employees_registry):');
    console.table(toDelete.rows);
    
    if (toDelete.rows.length > 0) {
      // Delete non-demo users
      const result = await pool.query(
        `DELETE FROM users WHERE email NOT IN (${demoEmails.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING email`,
        demoEmails
      );
      console.log(`\n✅ Removed ${result.rowCount} real organization admin(s) from users table`);
    } else {
      console.log('\n✅ No cleanup needed - only demo accounts in users table');
    }
    
    // Show remaining demo users
    const remaining = await pool.query('SELECT email, first_name, last_name, role FROM users ORDER BY role, email');
    console.log('\nRemaining demo users:');
    console.table(remaining.rows);
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

cleanup();
