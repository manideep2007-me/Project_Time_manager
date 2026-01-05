const pool = require('../src/config/database');

async function checkUser() {
  try {
    // Check if TechGaints admin exists
    const result = await pool.query(
      "SELECT email FROM users WHERE email = 'dm@gmail.com'"
    );
    console.log('dm@gmail.com in users table:', result.rows.length > 0 ? 'YES' : 'NO');
    
    // List all users with admin role
    const admins = await pool.query(
      "SELECT email, first_name, last_name, role FROM users WHERE role = 'admin'"
    );
    console.log('\nAll admin users:');
    console.log(admins.rows);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkUser();
