// Check Alice's 16-minute time entry
const pool = require('../src/config/database');

async function checkEntry() {
  try {
    // Find Alice's 16-minute entry
    const result = await pool.query(`
      SELECT 
        te.id, 
        te.task_id, 
        te.duration_minutes, 
        te.cost, 
        e.first_name, 
        e.last_name, 
        e.hourly_rate,
        t.title as task_title
      FROM time_entries te
      JOIN employees e ON te.employee_id = e.id
      JOIN tasks t ON te.task_id = t.id
      WHERE e.first_name = 'Alice' 
        AND e.last_name = 'Johnson'
        AND te.duration_minutes = 16
        AND te.is_active = true
      ORDER BY te.created_at DESC
      LIMIT 5
    `);
    
    console.log(`Found ${result.rows.length} entries with 16 minutes:\n`);
    
    for (const entry of result.rows) {
      const hourlyRate = parseFloat(entry.hourly_rate) || 790;
      const billedMinutes = 30; // 30-minute minimum
      const correctCost = (billedMinutes / 60) * hourlyRate;
      const currentCost = parseFloat(entry.cost) || 0;
      
      console.log(`Entry ID: ${entry.id}`);
      console.log(`  Task: ${entry.task_title}`);
      console.log(`  Duration: ${entry.duration_minutes} minutes`);
      console.log(`  Hourly Rate: ₹${hourlyRate}/hour`);
      console.log(`  Current Cost: ₹${currentCost.toFixed(2)}`);
      console.log(`  Correct Cost (30 min min): ₹${correctCost.toFixed(2)}`);
      
      if (Math.abs(currentCost - correctCost) > 0.01) {
        console.log(`  ⚠️  Cost needs update!`);
        await pool.query(
          'UPDATE time_entries SET cost = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [correctCost, entry.id]
        );
        console.log(`  ✅ Updated to ₹${correctCost.toFixed(2)}\n`);
      } else {
        console.log(`  ✓ Cost is correct\n`);
      }
    }
    
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

checkEntry();

