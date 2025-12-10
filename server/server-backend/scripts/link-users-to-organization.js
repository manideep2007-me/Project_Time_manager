/**
 * Script to link all existing users (admin, manager, employees) to the dummy organization
 */

const pool = require('../src/config/database');

async function linkUsersToOrganization() {
  const client = await pool.connect();
  
  try {
    console.log('Linking users to dummy organization...');
    
    // Get the dummy organization
    const orgResult = await client.query(
      "SELECT id, name, join_code FROM organizations WHERE name = 'Dummy Organization' LIMIT 1"
    );
    
    if (orgResult.rows.length === 0) {
      console.error('❌ Dummy organization not found. Please run create-dummy-org first.');
      process.exit(1);
    }
    
    const org = orgResult.rows[0];
    console.log(`Found organization: ${org.name} (ID: ${org.id}, Code: ${org.join_code})`);
    
    await client.query('BEGIN');
    
    // Get all users
    const usersResult = await client.query(
      'SELECT id, email, first_name, last_name, role FROM users'
    );
    
    console.log(`Found ${usersResult.rows.length} users to link`);
    
    let linkedCount = 0;
    let skippedCount = 0;
    
    for (const user of usersResult.rows) {
      try {
        // Check if employee record exists for this user
        let employeeResult = await client.query(
          'SELECT id FROM employees WHERE email = $1',
          [user.email]
        );
        
        let employeeId;
        
        if (employeeResult.rows.length === 0) {
          // Create employee record if it doesn't exist
          const newEmpResult = await client.query(
            `INSERT INTO employees (employee_id, first_name, last_name, email, salary_type, salary_amount, is_active)
             VALUES (uuid_generate_v4()::text, $1, $2, $3, 'monthly', 0, true)
             RETURNING id`,
            [user.first_name, user.last_name, user.email]
          );
          employeeId = newEmpResult.rows[0].id;
          console.log(`  Created employee record for ${user.email}`);
        } else {
          employeeId = employeeResult.rows[0].id;
        }
        
        // Link employee to organization
        await client.query(
          `INSERT INTO organization_memberships (organization_id, employee_id, role)
           VALUES ($1, $2, $3)
           ON CONFLICT (organization_id, employee_id) DO UPDATE SET role = EXCLUDED.role`,
          [org.id, employeeId, user.role || 'employee']
        );
        
        linkedCount++;
        console.log(`  ✅ Linked ${user.email} (${user.role}) to organization`);
      } catch (err) {
        skippedCount++;
        console.error(`  ❌ Failed to link ${user.email}:`, err.message);
      }
    }
    
    await client.query('COMMIT');
    
    console.log('\n✅ Summary:');
    console.log(`  Linked: ${linkedCount} users`);
    console.log(`  Skipped: ${skippedCount} users`);
    console.log(`  Organization: ${org.name} (${org.join_code})`);
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error linking users:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Run the script
linkUsersToOrganization()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Script failed:', err);
    process.exit(1);
  });

