// Migration runner for secondary database (project_registry)
const { getPool } = require('../src/config/databases');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const secondary = getPool('secondary');
  
  try {
    console.log('Reading migration file...');
    const migrationPath = path.join(__dirname, '../database/migrations/migrate-org-employee-registry.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Executing migration...');
    await secondary.query(sql);
    
    console.log('\n✅ Migration completed successfully!\n');
    
    // Verify the changes
    console.log('Verifying changes...\n');
    
    console.log('Organizations Registry:');
    const orgs = await secondary.query('SELECT * FROM organizations_registry LIMIT 3');
    console.table(orgs.rows);
    
    console.log('\nEmployees Registry:');
    const emps = await secondary.query('SELECT * FROM employees_registry LIMIT 3');
    console.table(emps.rows);
    
    console.log('\n✅ Verification complete!');
    
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    await secondary.end();
    process.exit(0);
  }
}

runMigration();
