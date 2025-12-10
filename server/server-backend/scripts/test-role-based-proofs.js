// Test script to verify role-based proof separation
// This script simulates what happens when different users upload proofs
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'project_time_manager',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
});

async function testRoleBasedProofs() {
  try {
    console.log('\n🧪 Testing Role-Based Proof Separation\n');
    console.log('=' .repeat(60));
    
    // Get user details
    const rajeshResult = await pool.query(
      'SELECT id, email, first_name, last_name, role FROM users WHERE email = $1',
      ['rajesh@company.com']
    );
    
    const aliceResult = await pool.query(
      'SELECT id, email, first_name, last_name, role FROM users WHERE email = $1',
      ['alice@company.com']
    );
    
    if (rajeshResult.rows.length === 0) {
      console.log('❌ Manager (Rajesh) not found in database');
      return;
    }
    
    if (aliceResult.rows.length === 0) {
      console.log('❌ Employee (Alice) not found in database');
      return;
    }
    
    const rajesh = rajeshResult.rows[0];
    const alice = aliceResult.rows[0];
    
    console.log('\n📋 User Details:\n');
    console.log(`👨‍💼 Manager: ${rajesh.email} (${rajesh.first_name} ${rajesh.last_name})`);
    console.log(`   User ID: ${rajesh.id}`);
    console.log(`   Role: ${rajesh.role}`);
    console.log('');
    console.log(`👩‍💻 Employee: ${alice.email} (${alice.first_name} ${alice.last_name})`);
    console.log(`   User ID: ${alice.id}`);
    console.log(`   Role: ${alice.role}`);
    
    // Check proofs for Rajesh (Manager)
    console.log('\n' + '='.repeat(60));
    console.log('\n📸 Proofs for Manager (Rajesh):\n');
    const rajeshProofs = await pool.query(
      `SELECT id, user_role, verified_timestamp, latitude, longitude, created_at
       FROM proof_of_work
       WHERE user_id = $1 AND user_role = $2
       ORDER BY verified_timestamp DESC`,
      [rajesh.id, rajesh.role]
    );
    
    if (rajeshProofs.rows.length === 0) {
      console.log('   No proofs found ✓');
    } else {
      console.log(`   Found ${rajeshProofs.rows.length} proof(s):`);
      rajeshProofs.rows.forEach((proof, idx) => {
        console.log(`   ${idx + 1}. Proof ID: ${proof.id}`);
        console.log(`      Role: ${proof.user_role}`);
        console.log(`      Timestamp: ${proof.verified_timestamp}`);
        console.log(`      Location: ${proof.latitude}, ${proof.longitude}`);
        console.log('');
      });
    }
    
    // Check proofs for Alice (Employee)
    console.log('='.repeat(60));
    console.log('\n📸 Proofs for Employee (Alice):\n');
    const aliceProofs = await pool.query(
      `SELECT id, user_role, verified_timestamp, latitude, longitude, created_at
       FROM proof_of_work
       WHERE user_id = $1 AND user_role = $2
       ORDER BY verified_timestamp DESC`,
      [alice.id, alice.role]
    );
    
    if (aliceProofs.rows.length === 0) {
      console.log('   No proofs found ✓');
    } else {
      console.log(`   Found ${aliceProofs.rows.length} proof(s):`);
      aliceProofs.rows.forEach((proof, idx) => {
        console.log(`   ${idx + 1}. Proof ID: ${proof.id}`);
        console.log(`      Role: ${proof.user_role}`);
        console.log(`      Timestamp: ${proof.verified_timestamp}`);
        console.log(`      Location: ${proof.latitude}, ${proof.longitude}`);
        console.log('');
      });
    }
    
    // Check ALL proofs in system
    console.log('='.repeat(60));
    console.log('\n📸 ALL Proofs in System:\n');
    const allProofs = await pool.query(
      `SELECT 
         p.id, 
         p.user_id, 
         p.user_role, 
         u.email, 
         u.first_name, 
         u.last_name,
         u.role as actual_user_role,
         p.verified_timestamp
       FROM proof_of_work p
       LEFT JOIN users u ON p.user_id::uuid = u.id
       ORDER BY p.verified_timestamp DESC`
    );
    
    if (allProofs.rows.length === 0) {
      console.log('   No proofs in system ✓');
    } else {
      console.log(`   Total proofs: ${allProofs.rows.length}\n`);
      allProofs.rows.forEach((proof, idx) => {
        console.log(`   ${idx + 1}. ${proof.email || 'Unknown user'}`);
        console.log(`      User Role in DB: ${proof.actual_user_role}`);
        console.log(`      Stored Role in Proof: ${proof.user_role} ${proof.user_role !== proof.actual_user_role ? '⚠️ MISMATCH' : '✓'}`);
        console.log(`      Timestamp: ${proof.verified_timestamp}`);
        console.log('');
      });
    }
    
    console.log('='.repeat(60));
    console.log('\n✅ Test complete!\n');
    console.log('💡 Expected behavior:');
    console.log('   - When Rajesh (manager) logs in and captures proof → shows in Manager\'s dashboard');
    console.log('   - When Alice (employee) logs in and captures proof → shows in Alice\'s dashboard');
    console.log('   - Proofs should be separated by user_id AND user_role');
    console.log('\n💡 How to test:');
    console.log('   1. Login as Rajesh (rajesh@company.com / manager123)');
    console.log('   2. Go to Manager Dashboard → Mark Time → Capture proof');
    console.log('   3. Logout and login as Alice (alice@company.com / employee123)');
    console.log('   4. Go to Proof of Work → Capture proof');
    console.log('   5. Each user should only see their own proofs\n');
    
  } catch (error) {
    console.error('❌ Error testing proofs:', error);
  } finally {
    await pool.end();
  }
}

testRoleBasedProofs();
