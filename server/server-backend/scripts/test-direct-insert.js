// Direct test of INSERT into organizations_registry
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: process.env.DB2_HOST || 'localhost',
  port: process.env.DB2_PORT || 5432,
  database: process.env.DB2_NAME || 'project_registry',
  user: process.env.DB2_USER || 'postgres',
  password: process.env.DB2_PASSWORD,
});

async function testInsert() {
  try {
    console.log('Testing direct INSERT into organizations_registry...\n');
    
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const result = await pool.query(
      `INSERT INTO organizations_registry 
        (organization_id, name, address, licence_key, licence_number, max_employees, licence_type, admin_email, admin_phone, admin_password, join_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, organization_id, name, join_code, created_at`,
      ['ORG-20260105-ABCDE', 'DirectTestCo', 'Test Address', 'TRIAL-DIRECT', 'TRIAL-DIRECT', 50, 'trial', 'directtest@test.com', '+919876543210', hashedPassword, 'DIRECTCODE']
    );
    
    console.log('✅ SUCCESS! Created organization:');
    console.log(result.rows[0]);
    
    // Clean up
    await pool.query('DELETE FROM organizations_registry WHERE admin_email = $1', ['directtest@test.com']);
    console.log('\n✅ Test data cleaned up');
    
  } catch (e) {
    console.error('❌ ERROR:', e.message);
    console.error('Detail:', e.detail);
  } finally {
    await pool.end();
  }
}

testInsert();
