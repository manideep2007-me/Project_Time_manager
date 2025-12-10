// Migration runner for project_team_memberships table
const pool = require('../src/config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('Reading migration file...');
    const migrationPath = path.join(__dirname, '../database/migrations/add-project-team-memberships.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Executing migration...');
    await pool.query(sql);
    
    console.log('\n✅ Migration completed successfully!\n');
    
    // Verify the changes
    console.log('Verifying table creation...\n');
    
    const tableCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'project_team_memberships'
      ORDER BY ordinal_position
    `);
    
    console.log('project_team_memberships columns:');
    console.table(tableCheck.rows);
    
    console.log('\n✅ Table created successfully!');
    
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

runMigration();
