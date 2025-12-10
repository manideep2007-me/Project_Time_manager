/**
 * Script to create a dummy organization for testing
 * This will create an organization linked to an admin user
 */

const pool = require('../src/config/database');
const bcrypt = require('bcryptjs');

function generateJoinCode(length = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function generateUniqueId() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `ORG-${date}-${random}`;
}

async function createDummyOrganization() {
  const client = await pool.connect();
  
  try {
    console.log('Creating dummy organization...');
    
    // Get the first admin user from the database
    const adminResult = await client.query(
      "SELECT id, email, first_name, last_name FROM users WHERE role = 'admin' LIMIT 1"
    );
    
    if (adminResult.rows.length === 0) {
      console.error('No admin user found. Please create an admin user first.');
      process.exit(1);
    }
    
    const admin = adminResult.rows[0];
    console.log(`Found admin user: ${admin.email}`);
    
    // Check if organization already exists for this admin
    let existingOrg = null;
    
    // Try organizations_registry first
    try {
      const checkRegistry = await client.query(
        'SELECT id, name, join_code FROM organizations_registry WHERE admin_email = $1',
        [admin.email]
      );
      if (checkRegistry.rows.length > 0) {
        existingOrg = checkRegistry.rows[0];
        console.log(`Organization already exists in organizations_registry: ${existingOrg.name}`);
        console.log(`Join Code: ${existingOrg.join_code}`);
        return;
      }
    } catch (err) {
      console.log('organizations_registry table check failed, trying organizations table...');
    }
    
    // Try organizations table
    try {
      const checkOrg = await client.query(
        'SELECT id, name, join_code FROM organizations WHERE admin_email = $1',
        [admin.email]
      );
      if (checkOrg.rows.length > 0) {
        existingOrg = checkOrg.rows[0];
        console.log(`Organization already exists in organizations: ${existingOrg.name}`);
        console.log(`Join Code: ${existingOrg.join_code}`);
        return;
      }
    } catch (err) {
      console.log('organizations table check failed...');
    }
    
    // Generate unique values
    const joinCode = generateJoinCode();
    const organizationId = generateUniqueId();
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await client.query('BEGIN');
    
    // Try to insert into organizations_registry first
    try {
      const insertResult = await client.query(
        `INSERT INTO organizations_registry (
          organization_id, name, address, licence_key, licence_number, 
          max_employees, licence_type, admin_email, admin_phone, admin_password, join_code
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id, organization_id, name, join_code`,
        [
          organizationId,
          'Dummy Organization',
          '123 Main Street, City, Country',
          'TRIAL-DUMMY-001',
          'TRIAL-DUMMY-001',
          50,
          'trial',
          admin.email,
          '+911234567890',
          hashedPassword,
          joinCode
        ]
      );
      
      await client.query('COMMIT');
      console.log('✅ Successfully created organization in organizations_registry');
      console.log(`Organization ID: ${insertResult.rows[0].organization_id}`);
      console.log(`Join Code: ${insertResult.rows[0].join_code}`);
      console.log(`Name: ${insertResult.rows[0].name}`);
      return;
    } catch (registryErr) {
      console.log('Failed to insert into organizations_registry, trying organizations table...');
      console.log('Error:', registryErr.message);
      
      // Rollback and try organizations table
      await client.query('ROLLBACK');
      
      try {
        const insertResult = await client.query(
          `INSERT INTO organizations (
            unique_id, name, address, licence_key, licence_number, 
            max_employees, licence_type, admin_email, admin_phone, admin_password, join_code
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING id, unique_id, name, join_code`,
          [
            organizationId,
            'Dummy Organization',
            '123 Main Street, City, Country',
            'TRIAL-DUMMY-001',
            'TRIAL-DUMMY-001',
            50,
            'trial',
            admin.email,
            '+911234567890',
            hashedPassword,
            joinCode
          ]
        );
        
        await client.query('COMMIT');
        console.log('✅ Successfully created organization in organizations');
        console.log(`Organization ID: ${insertResult.rows[0].unique_id}`);
        console.log(`Join Code: ${insertResult.rows[0].join_code}`);
        console.log(`Name: ${insertResult.rows[0].name}`);
      } catch (orgErr) {
        await client.query('ROLLBACK');
        console.error('❌ Failed to create organization in both tables');
        console.error('organizations_registry error:', registryErr.message);
        console.error('organizations error:', orgErr.message);
        throw orgErr;
      }
    }
    
  } catch (err) {
    console.error('Error creating dummy organization:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Run the script
createDummyOrganization()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Script failed:', err);
    process.exit(1);
  });

