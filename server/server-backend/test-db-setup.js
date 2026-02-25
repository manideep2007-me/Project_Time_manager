const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

console.log('Environment variables:');
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB2_NAME:', process.env.DB2_NAME);
console.log('DB2_HOST:', process.env.DB2_HOST);

const { primary, secondary } = require('./src/config/databases');

async function testDatabases() {
  try {
    console.log('\n=== Testing PRIMARY database (project_registry) ===');
    if (primary) {
      const r1 = await primary.query('SELECT current_database()');
      console.log('✅ Primary DB connected:', r1.rows[0].current_database);
    } else {
      console.log('❌ Primary DB not configured');
    }
    
    console.log('\n=== Testing SECONDARY database (project_time_manager) ===');
    if (secondary) {
      const r2 = await secondary.query('SELECT current_database()');
      console.log('✅ Secondary DB connected:', r2.rows[0].current_database);
      
      // Check for users table
      const users = await secondary.query(`SELECT COUNT(*) FROM users WHERE email_id = 'admin@company.com'`);
      console.log('Admin user exists:', users.rows[0].count > 0);
    } else {
      console.log('❌ Secondary DB not configured');
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await primary.end();
    if (secondary) await secondary.end();
    process.exit(0);
  }
}

testDatabases();
