const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function testConnection(dbConfig, label) {
  const pool = new Pool(dbConfig);
  
  console.log(`\n=== Testing ${label} ===`);
  console.log(`Host: ${dbConfig.host}`);
  console.log(`Port: ${dbConfig.port}`);
  console.log(`Database: ${dbConfig.database}`);
  console.log(`User: ${dbConfig.user}`);
  
  try {
    const res = await pool.query('SELECT NOW(), current_database() as db');
    console.log(`✓ Connected successfully!`);
    console.log(`  Current time: ${res.rows[0].now}`);
    console.log(`  Database: ${res.rows[0].db}`);
    
    // Get table count
    const tables = await pool.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log(`  Tables in database: ${tables.rows[0].count}`);
    
    await pool.end();
    return true;
  } catch (err) {
    console.log(`✗ Connection failed: ${err.message}`);
    await pool.end();
    return false;
  }
}

async function main() {
  console.log('Testing Database Connections...\n');
  
  // Test Primary Database (project_registry)
  const primaryConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'project_registry',
    user: process.env.DB_USER || 'postgres',
    password: String(process.env.DB_PASSWORD || ''),
  };
  
  const primarySuccess = await testConnection(primaryConfig, 'Primary Database (project_registry)');
  
  // Test Secondary Database (project_time_manager)
  const secondaryConfig = {
    host: process.env.DB2_HOST || 'localhost',
    port: process.env.DB2_PORT || 5432,
    database: process.env.DB2_NAME || 'project_time_manager',
    user: process.env.DB2_USER || 'postgres',
    password: String(process.env.DB2_PASSWORD || ''),
  };
  
  const secondarySuccess = await testConnection(secondaryConfig, 'Secondary Database (project_time_manager)');
  
  // Summary
  console.log('\n=== Summary ===');
  console.log(`Primary (project_registry): ${primarySuccess ? '✓ Connected' : '✗ Failed'}`);
  console.log(`Secondary (project_time_manager): ${secondarySuccess ? '✓ Connected' : '✗ Failed'}`);
  
  if (primarySuccess && secondarySuccess) {
    console.log('\n✓ All database connections successful!');
  } else {
    console.log('\n✗ Some database connections failed. Please check the configuration.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
