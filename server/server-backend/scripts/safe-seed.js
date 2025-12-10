const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

async function safeSeed() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'project_time_manager',
  });

  try {
    console.log('🔍 Safe seeding - checking for existing data...');
    
    // Check if admin user already exists
    const existingAdmin = await pool.query("SELECT id FROM users WHERE email = 'admin@company.com'");
    
    if (existingAdmin.rows.length > 0) {
      console.log('✅ Admin user already exists. Safe seeding complete.');
      console.log('   Use restore-all-projects.js to add sample projects if needed.');
      return;
    }
    
    console.log('📝 No admin user found. Creating admin user only...');
    
    // Only create admin user, don't touch existing data
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const user = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ('admin@company.com', $1, 'Admin', 'User', 'admin')
       RETURNING id`,
      [hashedPassword]
    );

    console.log('✅ Safe seeding complete!');
    console.log('🔑 Admin credentials: admin@company.com / admin123');
    console.log('📋 Use restore-all-projects.js to add sample projects if needed.');
    
  } catch (err) {
    console.error('❌ Safe seed failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

safeSeed();
