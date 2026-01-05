// Check employees_registry for newTechie admin
const { Pool } = require('pg');
require('dotenv').config();

const p = new Pool({
  host: process.env.DB2_HOST,
  port: process.env.DB2_PORT,
  database: process.env.DB2_NAME,
  user: process.env.DB2_USER,
  password: process.env.DB2_PASSWORD
});

async function check() {
  try {
    // Check all admins in employees_registry
    const result = await p.query(`
      SELECT employee_email, employee_name, role, organization_name, organization_id,
             password_hash IS NOT NULL as has_password, is_active
      FROM employees_registry 
      ORDER BY registered_at DESC 
      LIMIT 10
    `);
    console.log('All entries in employees_registry:');
    console.table(result.rows);
    
    // Check organizations
    const orgs = await p.query(`
      SELECT organization_id, name, admin_email, join_code 
      FROM organizations_registry 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    console.log('\nRecent organizations:');
    console.table(orgs.rows);
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await p.end();
  }
}

check();
