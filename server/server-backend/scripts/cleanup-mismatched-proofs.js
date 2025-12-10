// Clean up old mismatched proofs (uploaded with wrong role)
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'project_time_manager',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
});

async function cleanupMismatchedProofs() {
  try {
    console.log('\n🧹 Cleaning up mismatched proofs...\n');
    
    // Find all proofs where user_role doesn't match the user's actual role
    const mismatchedProofs = await pool.query(
      `SELECT 
         p.id, 
         p.user_id, 
         p.user_role, 
         u.email, 
         u.role as actual_role,
         p.verified_timestamp
       FROM proof_of_work p
       LEFT JOIN users u ON p.user_id::uuid = u.id
       WHERE p.user_role != u.role::text
       ORDER BY p.verified_timestamp DESC`
    );
    
    if (mismatchedProofs.rows.length === 0) {
      console.log('✅ No mismatched proofs found! System is clean.\n');
      return;
    }
    
    console.log(`⚠️  Found ${mismatchedProofs.rows.length} mismatched proof(s):\n`);
    
    mismatchedProofs.rows.forEach((proof, idx) => {
      console.log(`${idx + 1}. Proof ID: ${proof.id}`);
      console.log(`   User: ${proof.email}`);
      console.log(`   Actual Role: ${proof.actual_role}`);
      console.log(`   Stored Role: ${proof.user_role} ⚠️`);
      console.log(`   Timestamp: ${proof.verified_timestamp}`);
      console.log('');
    });
    
    console.log('🗑️  Deleting mismatched proofs...\n');
    
    const deleteResult = await pool.query(
      `DELETE FROM proof_of_work
       WHERE id IN (
         SELECT p.id 
         FROM proof_of_work p
         LEFT JOIN users u ON p.user_id::uuid = u.id
         WHERE p.user_role != u.role::text
       )`
    );
    
    console.log(`✅ Deleted ${deleteResult.rowCount} mismatched proof(s)\n`);
    console.log('💡 These proofs were uploaded with incorrect role assignment.');
    console.log('💡 With the fix in AuthContext.tsx, new proofs will use correct roles.\n');
    
  } catch (error) {
    console.error('❌ Error cleaning up proofs:', error);
  } finally {
    await pool.end();
  }
}

cleanupMismatchedProofs();
