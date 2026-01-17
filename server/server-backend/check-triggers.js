const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'project_time_manager',
  user: 'postgres',
  password: 'Super@123',
});

async function checkTriggers() {
  try {
    console.log('Triggers on time_entries table:');
    const triggers = await pool.query(`
      SELECT trigger_name, event_manipulation, action_statement, action_timing
      FROM information_schema.triggers 
      WHERE event_object_table = 'time_entries'
    `);
    if (triggers.rows.length === 0) {
      console.log('  No triggers found');
    } else {
      triggers.rows.forEach(t => console.log(t));
    }
    
    console.log('\nForeign key constraints on time_entries:');
    const fks = await pool.query(`
      SELECT 
        tc.constraint_name, 
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name='time_entries'
    `);
    
    if (fks.rows.length === 0) {
      console.log('  No foreign keys found');
    } else {
      fks.rows.forEach(r => console.log('  ' + r.column_name + ' -> ' + r.foreign_table_name + '(' + r.foreign_column_name + ')'));
    }
    
    // Check what tables exist
    console.log('\nExisting tables:');
    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    tables.rows.forEach(t => console.log('  ' + t.table_name));
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkTriggers();
