/**
 * Script to create organization_memberships table if it doesn't exist
 */

const pool = require('../src/config/database');

async function createOrganizationMembershipsTable() {
  const client = await pool.connect();
  
  try {
    console.log('Creating organization_memberships table...');
    
    await client.query('BEGIN');
    
    // Create organization_memberships table
    await client.query(`
      CREATE TABLE IF NOT EXISTS organization_memberships (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        role VARCHAR(50) DEFAULT 'member',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(organization_id, employee_id)
      )
    `);
    
    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_org_memberships_org_id ON organization_memberships(organization_id)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_org_memberships_employee_id ON organization_memberships(employee_id)
    `);
    
    await client.query('COMMIT');
    console.log('✅ Successfully created organization_memberships table');
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating organization_memberships table:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Run the script
createOrganizationMembershipsTable()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Script failed:', err);
    process.exit(1);
  });

