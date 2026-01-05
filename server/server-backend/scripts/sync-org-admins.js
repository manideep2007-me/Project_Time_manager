// Script to sync organization admins from registry to users table
const pool = require('../src/config/database');
const { secondary: registryPool } = require('../src/config/databases');

async function syncOrganizationAdmins() {
  try {
    // Get all organizations from registry
    const orgs = await registryPool.query(
      'SELECT name, admin_email, admin_password FROM organizations_registry'
    );
    
    console.log(`Found ${orgs.rows.length} organizations in registry`);
    
    for (const org of orgs.rows) {
      // Check if user already exists
      const existing = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [org.admin_email]
      );
      
      if (existing.rows.length === 0) {
        // Extract name from email
        const emailParts = org.admin_email.split('@')[0].split(/[._-]/);
        const firstName = emailParts[0] ? emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1) : 'Admin';
        const lastName = emailParts[1] ? emailParts[1].charAt(0).toUpperCase() + emailParts[1].slice(1) : org.name;
        
        // Create user with same password hash
        await pool.query(
          `INSERT INTO users (email, password_hash, first_name, last_name, role)
           VALUES ($1, $2, $3, $4, 'admin')`,
          [org.admin_email, org.admin_password, firstName, lastName]
        );
        console.log(`✅ Created user for: ${org.admin_email} (${org.name})`);
      } else {
        console.log(`⏭️  User already exists: ${org.admin_email}`);
      }
    }
    
    console.log('\nSync complete!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

syncOrganizationAdmins();
