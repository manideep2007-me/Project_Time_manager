const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'project_time_manager',
  password: process.env.DB_PASSWORD || 'Super@123',
  port: process.env.DB_PORT || 5432,
});

async function clearFrontendStorage() {
  try {
    console.log('🔧 Frontend Storage Clear Instructions');
    console.log('=====================================\n');
    
    console.log('The frontend has a stored authentication token with an old user ID.');
    console.log('This happens when the database is restored with new user IDs.\n');
    
    console.log('📱 To fix this, you have several options:\n');
    
    console.log('1. 🎯 EASIEST: Use the "Clear Storage" button in the login screen');
    console.log('   - Open the app');
    console.log('   - Look for the red "Clear Storage" button at the bottom');
    console.log('   - Tap it and then login again\n');
    
    console.log('2. 🔄 RELOAD: Force reload the app');
    console.log('   - Shake your device (or press Ctrl+M on Android emulator)');
    console.log('   - Tap "Reload" in the developer menu\n');
    
    console.log('3. 🗑️ CLEAR APP DATA: Clear all app data');
    console.log('   - Android: Settings > Apps > Project Manager > Storage > Clear Data');
    console.log('   - iOS: Delete and reinstall the app\n');
    
    console.log('4. 🔑 LOGIN: Just login with the new credentials');
    console.log('   - Manager: rajesh@company.com / manager123');
    console.log('   - Employee: alice@company.com / employee123');
    console.log('   - Employee: bob@company.com / employee123\n');
    
    console.log('✅ After clearing storage, you should be able to login successfully!');
    
    await pool.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    await pool.end();
  }
}

clearFrontendStorage();
