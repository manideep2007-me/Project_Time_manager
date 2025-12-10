// Test script to verify both primary and secondary database connections

require('dotenv').config();
const { primary, secondary } = require('../src/config/databases');

async function testDatabases() {
  console.log('Testing database connections...\n');

  try {
    // Test primary database
    console.log('Testing PRIMARY database...');
    const primaryResult = await primary.query('SELECT current_database(), now()');
    console.log('✓ PRIMARY database connected:');
    console.log(`  Database: ${primaryResult.rows[0].current_database}`);
    console.log(`  Timestamp: ${primaryResult.rows[0].now}\n`);
  } catch (error) {
    console.error('✗ PRIMARY database connection failed:');
    console.error(`  Error: ${error.message}\n`);
  }

  try {
    // Test secondary database
    if (secondary) {
      console.log('Testing SECONDARY database...');
      const secondaryResult = await secondary.query('SELECT current_database(), now()');
      console.log('✓ SECONDARY database connected:');
      console.log(`  Database: ${secondaryResult.rows[0].current_database}`);
      console.log(`  Timestamp: ${secondaryResult.rows[0].now}\n`);
    } else {
      console.log('⚠ SECONDARY database not configured (this is optional)');
      console.log('  To enable: Set DB2_HOST, DB2_PORT, DB2_NAME, DB2_USER, DB2_PASSWORD in .env\n');
    }
  } catch (error) {
    console.error('✗ SECONDARY database connection failed:');
    console.error(`  Error: ${error.message}\n`);
  }

  // Close connections
  await primary.end();
  if (secondary) await secondary.end();
  
  console.log('Database connection test complete.');
}

testDatabases().catch((error) => {
  console.error('Test failed with error:', error);
  process.exit(1);
});
