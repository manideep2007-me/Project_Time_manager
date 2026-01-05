// Check the organizations_registry table schema
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB2_HOST || 'localhost',
  port: process.env.DB2_PORT || 5432,
  database: process.env.DB2_NAME || 'project_registry',
  user: process.env.DB2_USER || 'postgres',
  password: process.env.DB2_PASSWORD,
});

async function checkSchema() {
  try {
    console.log('Connecting to project_registry database...');
    
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'organizations_registry'
      ORDER BY ordinal_position
    `);
    
    console.log('\n=== organizations_registry table schema ===\n');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'}`);
    });
    
    // Test a simple insert
    console.log('\n=== Testing INSERT statement ===\n');
    const testQuery = `
      INSERT INTO organizations_registry 
        (organization_id, name, address, licence_key, licence_number, max_employees, licence_type, admin_email, admin_phone, admin_password, join_code)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, organization_id, name, join_code
    `;
    
    // Test with sample data
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('testpassword', 10);
    
    const testData = [
      'ORG-20260105-TEST1',  // organization_id
      'Test Company',        // name
      'Test Address',        // address
      'TRIAL-TEST',          // licence_key
      'TRIAL-TEST',          // licence_number
      50,                    // max_employees
      'trial',               // licence_type
      'schematest@test.com', // admin_email
      '+911234567890',       // admin_phone
      hashedPassword,        // admin_password
      'TESTCODE123'          // join_code
    ];
    
    const insertResult = await pool.query(testQuery, testData);
    console.log('✅ INSERT successful!');
    console.log('Created organization:', insertResult.rows[0]);
    
    // Clean up test data
    await pool.query('DELETE FROM organizations_registry WHERE admin_email = $1', ['schematest@test.com']);
    console.log('✅ Test data cleaned up');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('Detail:', err.detail || 'No detail');
    console.error('Hint:', err.hint || 'No hint');
  } finally {
    await pool.end();
  }
}

checkSchema();
