// Script to update cost for existing time entries that don't have cost calculated
const pool = require('../src/config/database');

async function updateCosts() {
  try {
    console.log('🔄 Updating costs for existing time entries...\n');
    
    // Get all time entries that need cost recalculation (duration < 30 minutes should be billed as 30)
    const entries = await pool.query(`
      SELECT te.id, te.employee_id, te.duration_minutes, te.cost, e.hourly_rate
      FROM time_entries te
      JOIN employees e ON te.employee_id = e.id
      WHERE te.is_active = true 
        AND te.duration_minutes < 30
        AND e.hourly_rate IS NOT NULL
        AND e.hourly_rate > 0
      ORDER BY te.created_at DESC
    `);
    
    console.log(`Found ${entries.rows.length} time entries to update\n`);
    
    let updated = 0;
    for (const entry of entries.rows) {
      const durationMinutes = entry.duration_minutes || 0;
      // Apply 30-minute minimum billing rule
      const billedMinutes = durationMinutes < 30 ? 30 : durationMinutes;
      const hourlyRate = parseFloat(entry.hourly_rate) || 0;
      const cost = (billedMinutes / 60) * hourlyRate;
      
      await pool.query(
        'UPDATE time_entries SET cost = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [cost, entry.id]
      );
      
      updated++;
      if (updated % 10 === 0) {
        console.log(`  Updated ${updated} entries...`);
      }
    }
    
    console.log(`\n✅ Updated costs for ${updated} time entries`);
    
    // Verify some entries
    const sample = await pool.query(`
      SELECT te.id, te.duration_minutes, te.cost, e.first_name, e.last_name, e.hourly_rate
      FROM time_entries te
      JOIN employees e ON te.employee_id = e.id
      WHERE te.is_active = true AND te.cost > 0
      ORDER BY te.updated_at DESC
      LIMIT 5
    `);
    
    console.log('\n📊 Sample updated entries:');
    console.table(sample.rows);
    
  } catch (err) {
    console.error('❌ Error updating costs:', err);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

updateCosts();

