// Migration script to add role and password_hash columns to employees_registry
// Run this in project_registry database

const { Pool } = require('pg');
require('dotenv').config();

const registryPool = new Pool({
  host: process.env.DB2_HOST || 'localhost',
  port: process.env.DB2_PORT || 5432,
  database: process.env.DB2_NAME || 'project_registry',
  user: process.env.DB2_USER || 'postgres',
  password: process.env.DB2_PASSWORD || 'Super@123'
});

async function runMigration() {
  const client = await registryPool.connect();
  
  try {
    console.log('Starting migration: Add role and password_hash to employees_registry...\n');
    
    // Step 1: Add role column
    console.log('Step 1: Adding role column...');
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'employees_registry' AND column_name = 'role'
        ) THEN
          ALTER TABLE employees_registry ADD COLUMN role VARCHAR(50) DEFAULT 'employee';
          RAISE NOTICE 'role column added';
        ELSE
          RAISE NOTICE 'role column already exists';
        END IF;
      END $$;
    `);
    console.log('✅ Role column check complete');
    
    // Step 2: Add password_hash column
    console.log('Step 2: Adding password_hash column...');
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'employees_registry' AND column_name = 'password_hash'
        ) THEN
          ALTER TABLE employees_registry ADD COLUMN password_hash VARCHAR(255);
          RAISE NOTICE 'password_hash column added';
        ELSE
          RAISE NOTICE 'password_hash column already exists';
        END IF;
      END $$;
    `);
    console.log('✅ Password_hash column check complete');
    
    // Step 3: Add is_active column
    console.log('Step 3: Adding is_active column...');
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'employees_registry' AND column_name = 'is_active'
        ) THEN
          ALTER TABLE employees_registry ADD COLUMN is_active BOOLEAN DEFAULT true;
          RAISE NOTICE 'is_active column added';
        ELSE
          RAISE NOTICE 'is_active column already exists';
        END IF;
      END $$;
    `);
    console.log('✅ is_active column check complete');
    
    // Step 4: Create index on role
    console.log('Step 4: Creating index on role column...');
    await client.query('CREATE INDEX IF NOT EXISTS idx_emp_role ON employees_registry(role)');
    console.log('✅ Index created');
    
    // Step 5: Migrate existing admins from organizations_registry
    console.log('Step 5: Migrating existing organization admins...');
    const result = await client.query(`
      INSERT INTO employees_registry (organization_id, organization_name, employee_email, employee_phone, employee_name, password_hash, role, is_active)
      SELECT 
        org.organization_id,
        org.name as organization_name,
        org.admin_email as employee_email,
        org.admin_phone as employee_phone,
        CONCAT('Admin ', org.name) as employee_name,
        org.admin_password as password_hash,
        'admin' as role,
        true as is_active
      FROM organizations_registry org
      WHERE NOT EXISTS (
        SELECT 1 FROM employees_registry er 
        WHERE er.employee_email = org.admin_email 
        AND er.organization_id = org.organization_id
      )
      RETURNING employee_email
    `);
    console.log(`✅ Migrated ${result.rowCount} admin(s) to employees_registry`);
    
    // Step 6: Show summary
    console.log('\n📊 Migration Summary:');
    const summary = await client.query(`
      SELECT 
        COUNT(*) as total_employees, 
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
        COUNT(CASE WHEN role = 'manager' THEN 1 END) as managers,
        COUNT(CASE WHEN role = 'employee' OR role IS NULL THEN 1 END) as employees
      FROM employees_registry
    `);
    console.log(summary.rows[0]);
    
    console.log('\n✅ Migration completed successfully!');
    
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    throw err;
  } finally {
    client.release();
    await registryPool.end();
  }
}

runMigration().catch(err => {
  console.error(err);
  process.exit(1);
});
