/**
 * Migration script to update organizations table with new fields
 * Run this to add company details and admin registration fields
 */

const pool = require('../src/config/database');

async function migrateOrganizationSchema() {
  const client = await pool.connect();
  
  try {
    console.log('Starting organization schema migration...');
    
    await client.query('BEGIN');

    // Add new columns to organizations table
    console.log('Adding new columns...');
    
    // Add unique_id column
    await client.query(`
      ALTER TABLE organizations 
      ADD COLUMN IF NOT EXISTS unique_id VARCHAR(50) UNIQUE;
    `);

    // Add address column
    await client.query(`
      ALTER TABLE organizations 
      ADD COLUMN IF NOT EXISTS address TEXT;
    `);

    // Add licence_key column
    await client.query(`
      ALTER TABLE organizations 
      ADD COLUMN IF NOT EXISTS licence_key VARCHAR(255);
    `);

    // Add licence_number column
    await client.query(`
      ALTER TABLE organizations 
      ADD COLUMN IF NOT EXISTS licence_number VARCHAR(100);
    `);

    // Add max_employees column
    await client.query(`
      ALTER TABLE organizations 
      ADD COLUMN IF NOT EXISTS max_employees INTEGER DEFAULT 50;
    `);

    // Add licence_type column
    await client.query(`
      ALTER TABLE organizations 
      ADD COLUMN IF NOT EXISTS licence_type VARCHAR(50);
    `);

    // Modify admin_email to NOT NULL (only for new records)
    await client.query(`
      ALTER TABLE organizations 
      ALTER COLUMN admin_email SET DEFAULT '';
    `);

    // Modify admin_phone to NOT NULL (only for new records)
    await client.query(`
      ALTER TABLE organizations 
      ALTER COLUMN admin_phone SET DEFAULT '';
    `);

    // Add admin_password column
    await client.query(`
      ALTER TABLE organizations 
      ADD COLUMN IF NOT EXISTS admin_password VARCHAR(255);
    `);

    // Remove old admin_name column as we now require email/phone/password
    await client.query(`
      ALTER TABLE organizations 
      DROP COLUMN IF EXISTS admin_name;
    `);

    // Generate unique IDs for existing organizations
    console.log('Generating unique IDs for existing organizations...');
    const existingOrgs = await client.query(
      'SELECT id FROM organizations WHERE unique_id IS NULL'
    );

    for (const org of existingOrgs.rows) {
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const random = Math.random().toString(36).substring(2, 7).toUpperCase();
      const uniqueId = `ORG-${date}-${random}`;
      
      await client.query(
        'UPDATE organizations SET unique_id = $1 WHERE id = $2',
        [uniqueId, org.id]
      );
    }

    await client.query('COMMIT');
    console.log('✅ Organization schema migration completed successfully!');
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
migrateOrganizationSchema()
  .then(() => {
    console.log('Migration script finished');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration script failed:', err);
    process.exit(1);
  });
