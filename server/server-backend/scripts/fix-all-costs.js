// Fix ALL time entries with duration < 30 to use 30-minute minimum
const pool = require('../src/config/database');
const fs = require('fs');
const path = require('path');

async function fixAllCosts() {
  try {
    console.log('🔄 Fixing all time entries with duration < 30 minutes...\n');
    
    // Use SQL file for direct update
    const sqlPath = path.join(__dirname, 'fix-all-under-30min-costs.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    const result = await pool.query(sql);
    console.log(`✅ Updated all time entries with duration < 30 minutes`);
    console.log(`   Rows affected: ${result.rowCount}\n`);
    
    // Verify Alice's entries
    const aliceEntries = await pool.query(`
      SELECT 
        te.id,
        te.duration_minutes,
        te.cost,
        t.title as task_title,
        e.hourly_rate
      FROM time_entries te
      JOIN employees e ON te.employee_id = e.id
      JOIN tasks t ON te.task_id = t.id
      WHERE e.first_name = 'Alice' 
        AND e.last_name = 'Johnson'
        AND te.is_active = true
        AND te.duration_minutes < 30
      ORDER BY te.created_at DESC
    `);
    
    console.log(`📊 Alice's entries with duration < 30 minutes:`);
    console.table(aliceEntries.rows.map(e => ({
      task: e.task_title,
      duration: `${e.duration_minutes} min`,
      cost: `₹${parseFloat(e.cost).toFixed(2)}`,
      expected: `₹${(30 / 60 * parseFloat(e.hourly_rate)).toFixed(2)}`,
      hourly_rate: `₹${parseFloat(e.hourly_rate)}/hr`
    })));
    
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

fixAllCosts();

