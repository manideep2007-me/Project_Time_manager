// Migration script to fix organizations_registry table in secondary database (project_registry)
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function runMigration() {
  // Connect to secondary database (project_registry)
  const pool = new Pool({
    host: process.env.DB2_HOST || process.env.DB_HOST || 'localhost',
    port: process.env.DB2_PORT || process.env.DB_PORT || 5432,
    database: process.env.DB2_NAME || 'project_registry',
    user: process.env.DB2_USER || process.env.DB_USER || 'postgres',
    password: process.env.DB2_PASSWORD || process.env.DB_PASSWORD,
  });

  try {
    console.log('Connecting to project_registry database...');
    await pool.query('SELECT NOW()');
    console.log('✓ Connected successfully\n');

    console.log('Running migration: Fix organizations_registry table...\n');

    // Read and execute migration SQL
    const migrationPath = path.resolve(__dirname, '../database/migrations/004-fix-organizations-registry.sql');
    
    if (fs.existsSync(migrationPath)) {
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      // Split by semicolons and execute each statement
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        try {
          console.log(`Executing: ${statement.substring(0, 60)}...`);
          await pool.query(statement);
          console.log('✓ Success\n');
        } catch (err) {
          // Ignore "already exists" errors
          if (err.message.includes('already exists') || err.message.includes('duplicate')) {
            console.log(`⚠ Skipped (already exists)\n`);
          } else {
            console.error(`✗ Error: ${err.message}\n`);
          }
        }
      }
    } else {
      console.log('Migration file not found, running inline migration...\n');
      
      // Run inline migration
      const alterStatements = [
        "ALTER TABLE organizations_registry ADD COLUMN IF NOT EXISTS name VARCHAR(255)",
        "ALTER TABLE organizations_registry ADD COLUMN IF NOT EXISTS licence_key VARCHAR(100)",
        "ALTER TABLE organizations_registry ADD COLUMN IF NOT EXISTS admin_password VARCHAR(255)",
        "ALTER TABLE organizations_registry ADD COLUMN IF NOT EXISTS join_code VARCHAR(20)",
        "ALTER TABLE organizations_registry ADD COLUMN IF NOT EXISTS logo_url TEXT",
        "ALTER TABLE organizations_registry ADD COLUMN IF NOT EXISTS state_province VARCHAR(100)",
        "ALTER TABLE organizations_registry ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20)",
      ];

      for (const stmt of alterStatements) {
        try {
          console.log(`Executing: ${stmt}`);
          await pool.query(stmt);
          console.log('✓ Success\n');
        } catch (err) {
          if (err.message.includes('already exists') || err.message.includes('duplicate')) {
            console.log(`⚠ Skipped (already exists)\n`);
          } else {
            console.error(`✗ Error: ${err.message}\n`);
          }
        }
      }

      // Create indexes
      try {
        await pool.query("CREATE INDEX IF NOT EXISTS idx_org_join_code ON organizations_registry(join_code)");
        console.log('✓ Created index on join_code\n');
      } catch (err) {
        console.log(`⚠ Index creation skipped: ${err.message}\n`);
      }
    }

    // Verify the table structure
    console.log('\n--- Verifying table structure ---');
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'organizations_registry'
      ORDER BY ordinal_position
    `);
    
    console.log('\norganizations_registry columns:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
    });

    // Show sample data if exists
    const count = await pool.query('SELECT COUNT(*) FROM organizations_registry');
    console.log(`\nTotal organizations: ${count.rows[0].count}`);

    if (parseInt(count.rows[0].count) > 0) {
      const sample = await pool.query('SELECT id, organization_id, name, admin_email, join_code FROM organizations_registry LIMIT 3');
      console.log('\nSample data:');
      sample.rows.forEach(row => {
        console.log(`  - ${row.name || row.organization_id}: ${row.admin_email} (code: ${row.join_code || 'N/A'})`);
      });
    }

    console.log('\n✅ Migration completed successfully!');

  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
