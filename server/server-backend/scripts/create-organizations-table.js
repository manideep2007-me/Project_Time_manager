/**
 * Script to create organizations table if it doesn't exist
 */

const pool = require('../src/config/database');

async function createOrganizationsTable() {
  const client = await pool.connect();
  
  try {
    console.log('Creating organizations table...');
    
    await client.query('BEGIN');
    
    // Create organizations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        unique_id VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        address TEXT,
        licence_key VARCHAR(255),
        licence_number VARCHAR(100),
        max_employees INTEGER DEFAULT 50,
        licence_type VARCHAR(50),
        admin_email VARCHAR(255) NOT NULL,
        admin_phone VARCHAR(50) NOT NULL,
        admin_password VARCHAR(255) NOT NULL,
        join_code VARCHAR(64) UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create index on admin_email for faster lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_organizations_admin_email ON organizations(admin_email)
    `);
    
    // Create index on join_code for faster lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_organizations_join_code ON organizations(join_code)
    `);
    
    await client.query('COMMIT');
    console.log('✅ Successfully created organizations table');
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating organizations table:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Run the script
createOrganizationsTable()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Script failed:', err);
    process.exit(1);
  });

