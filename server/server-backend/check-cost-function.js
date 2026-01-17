const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'project_time_manager',
  user: 'postgres',
  password: 'Super@123'
});

async function checkFunction() {
  try {
    const result = await pool.query(`
      SELECT prosrc 
      FROM pg_proc 
      WHERE proname = 'calculate_time_entry_cost'
    `);
    
    if (result.rows.length > 0) {
      console.log('Function calculate_time_entry_cost:\n');
      console.log(result.rows[0].prosrc);
    } else {
      console.log('Function not found');
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkFunction();
