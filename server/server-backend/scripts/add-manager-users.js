const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'project_time_manager',
  password: process.env.DB_PASSWORD || 'Super@123',
  port: process.env.DB_PORT || 5432,
});

async function createManagerUsers() {
  try {
    console.log('🔧 Creating manager and employee users...\n');
    
    // Check if users already exist
    const existingUsers = await pool.query('SELECT email FROM users WHERE email IN ($1, $2, $3)', 
      ['rajesh@company.com', 'alice@company.com', 'bob@company.com']);
    
    if (existingUsers.rows.length > 0) {
      console.log('⚠️  Some users already exist. Updating existing users...\n');
      
      // Update existing users
      for (const user of existingUsers.rows) {
        if (user.email === 'rajesh@company.com') {
          const managerPassword = await bcrypt.hash('manager123', 10);
          await pool.query(
            'UPDATE users SET password_hash = $1, role = $2, first_name = $3, last_name = $4 WHERE email = $5',
            [managerPassword, 'manager', 'Rajesh', 'Kumar', 'rajesh@company.com']
          );
          console.log('✅ Updated manager: rajesh@company.com / manager123');
        } else if (user.email === 'alice@company.com') {
          const employeePassword = await bcrypt.hash('employee123', 10);
          await pool.query(
            'UPDATE users SET password_hash = $1, role = $2, first_name = $3, last_name = $4 WHERE email = $5',
            [employeePassword, 'employee', 'Alice', 'Johnson', 'alice@company.com']
          );
          console.log('✅ Updated employee: alice@company.com / employee123');
        } else if (user.email === 'bob@company.com') {
          const employeePassword = await bcrypt.hash('employee123', 10);
          await pool.query(
            'UPDATE users SET password_hash = $1, role = $2, first_name = $3, last_name = $4 WHERE email = $5',
            [employeePassword, 'employee', 'Bob', 'Williams', 'bob@company.com']
          );
          console.log('✅ Updated employee: bob@company.com / employee123');
        }
      }
    } else {
      // Create new users
      const managerPassword = await bcrypt.hash('manager123', 10);
      await pool.query(
        'INSERT INTO users (email, password_hash, first_name, last_name, role, is_active) VALUES ($1, $2, $3, $4, $5, $6)',
        ['rajesh@company.com', managerPassword, 'Rajesh', 'Kumar', 'manager', true]
      );
      console.log('✅ Created manager: rajesh@company.com / manager123');
      
      const employeePassword = await bcrypt.hash('employee123', 10);
      await pool.query(
        'INSERT INTO users (email, password_hash, first_name, last_name, role, is_active) VALUES ($1, $2, $3, $4, $5, $6)',
        ['alice@company.com', employeePassword, 'Alice', 'Johnson', 'employee', true]
      );
      console.log('✅ Created employee: alice@company.com / employee123');
      
      await pool.query(
        'INSERT INTO users (email, password_hash, first_name, last_name, role, is_active) VALUES ($1, $2, $3, $4, $5, $6)',
        ['bob@company.com', employeePassword, 'Bob', 'Williams', 'employee', true]
      );
      console.log('✅ Created employee: bob@company.com / employee123');
    }
    
    console.log('\n🎉 All users ready!');
    console.log('\n🔑 Login Credentials:');
    console.log('👨‍💼 Manager: rajesh@company.com / manager123');
    console.log('👩‍💻 Employee: alice@company.com / employee123');
    console.log('👨‍💻 Employee: bob@company.com / employee123');
    console.log('👑 Admin: admin@company.com / admin123');
    
    console.log('\n📱 Now you can login with manager credentials to see all the data!');
    
    await pool.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    await pool.end();
  }
}

createManagerUsers();
