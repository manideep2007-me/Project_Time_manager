const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'project_time_manager',
  user: 'postgres',
  password: 'Super@123'
});

async function checkSchema() {
  try {
    console.log('TIME_ENTRIES table columns:');
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'time_entries' 
      ORDER BY ordinal_position
    `);
    result.rows.forEach(c => console.log('  ' + c.column_name + ': ' + c.data_type));
    
    console.log('\nForeign key constraints:');
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
    fks.rows.forEach(r => console.log('  ' + r.column_name + ' -> ' + r.foreign_table_name + '(' + r.foreign_column_name + ')'));
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkSchema();
