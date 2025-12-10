// Check if Alice has login credentials
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'project_time_manager',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
});

async function checkUserCredentials() {
  try {
    console.log('\n🔍 Checking user credentials...\n');
    
    // Get all users and check if they have passwords set
    const usersResult = await pool.query(
      `SELECT id, email, first_name, last_name, role, is_active, 
              CASE WHEN password_hash IS NOT NULL AND password_hash != '' THEN 'Yes' ELSE 'No' END as has_password
       FROM users 
       ORDER BY role, email`
    );
    
    console.log('📋 All users in system:\n');
    usersResult.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Name: ${user.first_name} ${user.last_name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.is_active}`);
      console.log(`   Has Password: ${user.has_password}`);
      console.log('');
    });
    
    console.log('\n💡 If employees don\'t have passwords, we need to either:');
    console.log('   1. Set passwords for them (e.g., password123)');
    console.log('   2. Modify loginWithUser to use employee-specific login');
    console.log('   3. Create a special "impersonation" endpoint\n');
    
  } catch (error) {
    console.error('❌ Error checking credentials:', error);
  } finally {
    await pool.end();
  }
}

checkUserCredentials();
