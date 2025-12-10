// Migration script to remove organization_id from employees_registry table

require('dotenv').config();
const { Client } = require('pg');

async function migrateDatabase() {
  const client = new Client({
    host: process.env.DB2_HOST || 'localhost',
    port: process.env.DB2_PORT || 5432,
    database: process.env.DB2_NAME || 'project_registry',
    user: process.env.DB2_USER || 'postgres',
    password: process.env.DB2_PASSWORD,
  });

  try {
    console.log('Connecting to project_registry database...');
    await client.connect();
    console.log('✓ Connected\n');

    console.log('Removing organization_id field from employees_registry...');
    
    // Drop the unique constraint that includes organization_id
    await client.query(`
      ALTER TABLE employees_registry 
      DROP CONSTRAINT IF EXISTS employees_registry_organization_id_employee_email_key;
    `);
    console.log('✓ Dropped unique constraint');

    // Drop the index on organization_id
    await client.query(`
      DROP INDEX IF EXISTS idx_emp_org_id;
    `);
    console.log('✓ Dropped index on organization_id');

    // Drop the foreign key constraint
    await client.query(`
      ALTER TABLE employees_registry 
      DROP CONSTRAINT IF EXISTS employees_registry_organization_id_fkey;
    `);
    console.log('✓ Dropped foreign key constraint');

    // Drop the organization_id column
    await client.query(`
      ALTER TABLE employees_registry 
      DROP COLUMN IF EXISTS organization_id;
    `);
    console.log('✓ Dropped organization_id column');

    // Add new unique constraint on organization_name and employee_email
    await client.query(`
      ALTER TABLE employees_registry 
      ADD CONSTRAINT employees_registry_org_name_email_unique 
      UNIQUE (organization_name, employee_email);
    `);
    console.log('✓ Added new unique constraint on (organization_name, employee_email)');

    // Verify the changes
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'employees_registry' 
      ORDER BY ordinal_position;
    `);

    console.log('\n✅ Migration completed successfully!');
    console.log('\nCurrent employees_registry columns:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type})`);
    });

  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrateDatabase();
