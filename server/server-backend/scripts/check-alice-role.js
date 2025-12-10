// Check Alice's role in the database
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'project_time_manager',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
});

async function checkAliceRole() {
  try {
    console.log('\n🔍 Checking Alice\'s role in database...\n');
    
    // Find all users with 'alice' in their email
    const usersResult = await pool.query(
      `SELECT id, email, first_name, last_name, role, is_active 
       FROM users 
       WHERE email ILIKE '%alice%' OR first_name ILIKE '%alice%' OR last_name ILIKE '%alice%'
       ORDER BY email`
    );
    
    if (usersResult.rows.length === 0) {
      console.log('❌ No users found with "alice" in email or name');
      return;
    }
    
    console.log('📋 Found users:');
    usersResult.rows.forEach((user, index) => {
      console.log(`\n${index + 1}. User Details:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.first_name} ${user.last_name}`);
      console.log(`   Role: ${user.role} ⭐`);
      console.log(`   Active: ${user.is_active}`);
    });
    
    // Check proofs for each Alice user
    console.log('\n\n📸 Checking proof_of_work records for these users...\n');
    
    for (const user of usersResult.rows) {
      const proofsResult = await pool.query(
        `SELECT id, user_role, verified_timestamp, latitude, longitude, created_at
         FROM proof_of_work
         WHERE user_id = $1
         ORDER BY verified_timestamp DESC
         LIMIT 5`,
        [user.id]
      );
      
      console.log(`\n👤 ${user.email} (User Role: ${user.role}):`);
      if (proofsResult.rows.length === 0) {
        console.log('   No proofs found');
      } else {
        console.log(`   Found ${proofsResult.rows.length} proofs (showing last 5):`);
        proofsResult.rows.forEach((proof, idx) => {
          console.log(`   ${idx + 1}. Proof ID: ${proof.id}`);
          console.log(`      Stored Role: ${proof.user_role} ${proof.user_role !== user.role ? '⚠️ MISMATCH!' : '✓'}`);
          console.log(`      Timestamp: ${proof.verified_timestamp}`);
          console.log(`      Location: ${proof.latitude}, ${proof.longitude}`);
        });
      }
    }
    
    // Check if there are any manager users
    console.log('\n\n👨‍💼 All Manager users in system:\n');
    const managersResult = await pool.query(
      `SELECT id, email, first_name, last_name, role 
       FROM users 
       WHERE role = 'manager'
       ORDER BY email`
    );
    
    if (managersResult.rows.length === 0) {
      console.log('❌ No managers found in system');
    } else {
      managersResult.rows.forEach((manager, index) => {
        console.log(`${index + 1}. ${manager.email} - ${manager.first_name} ${manager.last_name} (ID: ${manager.id})`);
      });
    }
    
    console.log('\n✅ Check complete!\n');
    
  } catch (error) {
    console.error('❌ Error checking Alice role:', error);
  } finally {
    await pool.end();
  }
}

checkAliceRole();
