// Delete all time entries from the database
// This script removes all logged time records as requested
require('dotenv').config();
const pool = require('../src/config/database');

async function deleteAllTimeEntries() {
  try {
    console.log('\n⚠️  WARNING: This will delete ALL time entries from the database!\n');
    console.log('Waiting 3 seconds... Press Ctrl+C to cancel.\n');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('Deleting all time entries...\n');
    
    // Delete all time entries
    const deleteResult = await pool.query('DELETE FROM time_entries');
    
    console.log(`✅ Successfully deleted ${deleteResult.rowCount} time entries\n`);
    
    // Verify deletion
    const countResult = await pool.query('SELECT COUNT(*) as count FROM time_entries');
    const remainingCount = parseInt(countResult.rows[0].count);
    
    if (remainingCount === 0) {
      console.log('✅ Verification: All time entries have been deleted.\n');
    } else {
      console.log(`⚠️  Warning: ${remainingCount} time entries still remain.\n`);
    }
    
  } catch (error) {
    console.error('❌ Error deleting time entries:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

deleteAllTimeEntries();

