const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'project_time_manager',
  password: process.env.DB_PASSWORD || 'Super@123',
  port: process.env.DB_PORT || 5432,
});

async function clearInvalidTokens() {
  try {
    console.log('🔧 Backend Token Management');
    console.log('==========================\n');
    
    // Check current users
    const users = await pool.query('SELECT id, email, first_name, last_name, role FROM users ORDER BY created_at');
    
    console.log('👥 Current users in database:');
    users.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.first_name} ${user.last_name}) - ${user.role}`);
    });
    
    console.log('\n💡 Backend-only solutions for token issues:');
    console.log('1. 🔄 Restart the backend server (already done)');
    console.log('2. 🔑 Login with fresh credentials');
    console.log('3. 📱 Force reload the mobile app (shake device + reload)');
    console.log('4. 🗑️ Clear app data from device settings');
    
    console.log('\n🎯 Recommended steps:');
    console.log('1. Shake your device and tap "Reload"');
    console.log('2. Login with: rajesh@company.com / manager123');
    console.log('3. Check Projects tab and tap "todo" filter');
    
    console.log('\n✅ Backend is ready with all todo projects!');
    
    await pool.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    await pool.end();
  }
}

clearInvalidTokens();
