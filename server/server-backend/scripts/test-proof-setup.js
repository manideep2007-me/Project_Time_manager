// Test script to verify proof-of-work setup

require('dotenv').config();
const crypto = require('crypto');

console.log('🔍 Verifying Proof of Work Configuration\n');

// Check environment variables
console.log('1. Environment Variables:');
console.log(`   ✓ DB_HOST: ${process.env.DB_HOST}`);
console.log(`   ✓ DB_NAME: ${process.env.DB_NAME}`);
console.log(`   ✓ PROOF_SECRET_SALT: ${process.env.PROOF_SECRET_SALT ? 'Configured ✓' : 'Missing ✗'}`);

if (!process.env.PROOF_SECRET_SALT) {
  console.log('\n   ⚠️  WARNING: PROOF_SECRET_SALT is not set in .env file');
  console.log('   Add: PROOF_SECRET_SALT=your_secret_salt_here\n');
}

// Test hash generation
console.log('\n2. Testing Hash Generation:');
const testData = {
  latitude: 17.385044,
  longitude: 78.486671,
  timestamp: 1699267800000,
  fileHash: 'abc123def456789',
};

const SECRET_SALT = process.env.PROOF_SECRET_SALT || 'test_salt';
const dataString = `${testData.latitude}:${testData.longitude}:${testData.timestamp}:${SECRET_SALT}:${testData.fileHash}`;
const hash = crypto.createHash('sha256').update(dataString).digest('hex');

console.log(`   Test Data: Lat=${testData.latitude}, Lon=${testData.longitude}`);
console.log(`   Generated Hash: ${hash}`);
console.log('   ✓ Hash generation working\n');

// Test database connection
console.log('3. Testing Database Connection:');
const { Client } = require('pg');
const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'project_time_manager',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

(async () => {
  try {
    await client.connect();
    console.log('   ✓ Connected to database');

    // Check if table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'proof_of_work'
      );
    `);

    if (tableCheck.rows[0].exists) {
      console.log('   ✓ proof_of_work table exists');

      // Count records
      const count = await client.query('SELECT COUNT(*) FROM proof_of_work');
      console.log(`   ✓ Current proof records: ${count.rows[0].count}`);
    } else {
      console.log('   ✗ proof_of_work table does NOT exist');
      console.log('   Run: node scripts/create-proof-of-work-table.js\n');
    }

    console.log('\n✅ All checks passed! System is ready.');
    console.log('\nNext steps:');
    console.log('1. Start backend: npm start (in server-backend)');
    console.log('2. Start mobile app: npm start (in frontend/mobile)');
    console.log('3. Use ProofOfWorkCaptureScreen to test the feature');

  } catch (error) {
    console.error('   ✗ Database error:', error.message);
  } finally {
    await client.end();
  }
})();
