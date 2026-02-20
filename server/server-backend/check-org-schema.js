const { Pool } = require('pg');

const pool = new Pool({ 
  host: 'localhost', 
  port: 5432, 
  user: 'postgres', 
  password: '123456', 
  database: 'project_registry' 
});

async function checkSchema() {
  try {
    console.log('\n=== Checking organizations_registry table ===');
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'organizations_registry' 
      ORDER BY ordinal_position
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ Table organizations_registry does NOT exist!');
      console.log('\nCreating the table...');
      
      // Create the organizations_registry table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS organizations_registry (
          id SERIAL PRIMARY KEY,
          organization_id VARCHAR(30) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          address TEXT,
          industry VARCHAR(100),
          city VARCHAR(100),
          state_province VARCHAR(100),
          country VARCHAR(100),
          zip_code VARCHAR(20),
          logo_url TEXT,
          join_code VARCHAR(20) UNIQUE NOT NULL,
          admin_email VARCHAR(255) UNIQUE NOT NULL,
          admin_phone VARCHAR(50),
          admin_password_hash TEXT NOT NULL,
          licence_key VARCHAR(100) NOT NULL,
          licence_number VARCHAR(100),
          licence_type VARCHAR(50) NOT NULL,
          max_employees INT DEFAULT 10,
          database_name VARCHAR(100),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Created organizations_registry table');
    } else {
      console.log('✅ Table organizations_registry exists with columns:');
      result.rows.forEach(c => console.log('  -', c.column_name, ':', c.data_type));
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkSchema();
