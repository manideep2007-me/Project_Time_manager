const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ 
  host: 'localhost', 
  port: 5432, 
  user: 'postgres', 
  password: '123456', 
  database: 'project_time_manager' 
});

async function createAdmin() {
  try {
    // Hash the password
    const hash = await bcrypt.hash('password123', 10);
    
    // Check if admin already exists
    const existingCheck = await pool.query('SELECT user_id FROM users WHERE email_id = $1', ['admin@company.com']);
    
    if (existingCheck.rows.length > 0) {
      console.log('✅ Admin user already exists');
      const update = await pool.query(
        'UPDATE users SET password_hash = $1 WHERE email_id = $2 RETURNING user_id, email_id, role',
        [hash, 'admin@company.com']
      );
      console.log('✅ Updated admin password:', update.rows[0]);
    } else {
      // Create admin user
      const result = await pool.query(
        `INSERT INTO users (email_id, password_hash, first_name, last_name, role, phone_number) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING user_id, email_id, first_name, last_name, role`,
        ['admin@company.com', hash, 'Admin', 'User', 'admin', '1234567890']
      );
      console.log('✅ Created admin user:', result.rows[0]);
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

createAdmin();
