// Script to fix Alice's time entry cost for 16 minutes -> should be billed as 30 minutes
const pool = require('../src/config/database');

async function fixCost() {
  try {
    console.log('🔍 Finding Alice Johnson\'s recent time entries...\n');
    
    // Find Alice's employee ID
    const alice = await pool.query(`
      SELECT id, first_name, last_name, hourly_rate 
      FROM employees 
      WHERE first_name = 'Alice' AND last_name = 'Johnson' AND is_active = true
    `);
    
    if (alice.rows.length === 0) {
      console.log('❌ Alice Johnson not found');
      return;
    }
    
    const aliceId = alice.rows[0].id;
    const hourlyRate = parseFloat(alice.rows[0].hourly_rate) || 790;
    
    console.log(`✅ Found Alice: ${alice.rows[0].first_name} ${alice.rows[0].last_name}`);
    console.log(`   Hourly Rate: ₹${hourlyRate}/hour\n`);
    
    // Find time entries for Alice that need cost recalculation
    const entries = await pool.query(`
      SELECT te.id, te.task_id, te.duration_minutes, te.cost, t.title as task_title
      FROM time_entries te
      JOIN tasks t ON te.task_id = t.id
      WHERE te.employee_id = $1 
        AND te.is_active = true
        AND te.duration_minutes < 30
      ORDER BY te.created_at DESC
      LIMIT 10
    `, [aliceId]);
    
    console.log(`Found ${entries.rows.length} time entries with duration < 30 minutes:\n`);
    
    for (const entry of entries.rows) {
      const actualMinutes = entry.duration_minutes;
      const billedMinutes = 30; // 30-minute minimum
      const correctCost = (billedMinutes / 60) * hourlyRate;
      const currentCost = parseFloat(entry.cost) || 0;
      
      console.log(`Entry ID: ${entry.id}`);
      console.log(`  Task: ${entry.task_title}`);
      console.log(`  Actual Duration: ${actualMinutes} minutes`);
      console.log(`  Billed Duration: ${billedMinutes} minutes (minimum)`);
      console.log(`  Current Cost: ₹${currentCost.toFixed(2)}`);
      console.log(`  Correct Cost: ₹${correctCost.toFixed(2)}`);
      
      if (Math.abs(currentCost - correctCost) > 0.01) {
        await pool.query(
          'UPDATE time_entries SET cost = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [correctCost, entry.id]
        );
        console.log(`  ✅ Updated cost to ₹${correctCost.toFixed(2)}\n`);
      } else {
        console.log(`  ✓ Cost is already correct\n`);
      }
    }
    
    console.log('✅ Cost update complete!');
    
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

fixCost();

