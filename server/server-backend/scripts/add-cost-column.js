// Migration script to add cost column to time_entries table
const pool = require('../src/config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('Reading migration file...');
    const migrationPath = path.join(__dirname, '../database/migrations/add-cost-to-time-entries.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Executing migration...');
    await pool.query(sql);
    
    console.log('\n✅ Migration completed successfully!\n');
    
    // Verify the changes
    console.log('Verifying column addition...\n');
    
    const columnCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'time_entries' AND column_name = 'cost'
    `);
    
    if (columnCheck.rows.length > 0) {
      console.log('cost column details:');
      console.table(columnCheck.rows);
      console.log('\n✅ Column added successfully!');
    } else {
      console.log('⚠️  Column not found - migration may have failed');
    }
    
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

