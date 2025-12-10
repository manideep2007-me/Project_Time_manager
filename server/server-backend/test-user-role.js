const pool = require('./src/config/database');

async function checkUserRole() {
  try {
    const result = await pool.query("SELECT email, first_name, last_name, role FROM users WHERE email = 'rajesh@company.com'");
    console.log('User:', result.rows[0]);
    
    const empResult = await pool.query("SELECT id, employee_id, first_name, last_name, department FROM employees WHERE email = 'rajesh@company.com' LIMIT 1");
    console.log('Employee:', empResult.rows[0]);
    
    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    await pool.end();
  }
}

checkUserRole();

