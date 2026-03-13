const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Connect to secondary database (project_time_manager) where user photos are stored
const secondaryPool = new Pool({
  user: process.env.DB2_USER || 'postgres',
  host: process.env.DB2_HOST || 'localhost',
  database: process.env.DB2_NAME || 'project_time_manager',
  password: String(process.env.DB2_PASSWORD || '123456'),
  port: process.env.DB2_PORT || 5432,
});

// Connect to primary database (project_registry)
const primaryPool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'project_registry',
  password: String(process.env.DB_PASSWORD || '123456'),
  port: process.env.DB_PORT || 5432,
});

async function checkPhotos() {
  try {
    // Check secondary DB users
    console.log('\n=== Secondary DB (project_time_manager) - Demo Users ===\n');
    const result = await secondaryPool.query('SELECT user_id, email_id, first_name, last_name, photograph, role FROM users');
    result.rows.forEach(u => {
      console.log(`${u.first_name} ${u.last_name} (${u.email_id}) - Role: ${u.role}`);
      console.log(`  Photo: ${u.photograph || 'NULL'}\n`);
    });
    
    // Check primary DB for organization users
    console.log('\n=== Primary DB (project_registry) - Tables ===\n');
    const tables = await primaryPool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);
    console.log('Tables:', tables.rows.map(t => t.table_name).join(', '));
    
    // Check employees_registry schema
    console.log('\n=== employees_registry columns ===');
    const cols = await primaryPool.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'employees_registry' ORDER BY ordinal_position
    `);
    console.log(cols.rows.map(c => c.column_name).join(', '));
    
    // Find Walmart user
    console.log('\n=== Searching for "Walmart" user ===\n');
    const walmartSearch = await primaryPool.query(`
      SELECT * FROM employees_registry 
      WHERE LOWER(employee_name) LIKE '%walmart%' 
         OR LOWER(organization_name) LIKE '%walmart%'
    `);
    if (walmartSearch.rows.length > 0) {
      console.log('Found Walmart:');
      walmartSearch.rows.forEach(u => {
        console.log(`  Name: ${u.employee_name}`);
        console.log(`  Org: ${u.organization_name}`);
        console.log(`  Email: ${u.employee_email}`);
        console.log(`  Role: ${u.role}`);
      });
    } else {
      console.log('Walmart not found in employees_registry');
    }
    
    // Check if photograph column exists
    const hasPhoto = cols.rows.some(c => c.column_name === 'photograph');
    console.log(`\n⚠️  Photograph column exists: ${hasPhoto}`);
    if (!hasPhoto) {
      console.log('   -> Need to add photograph column to employees_registry!');
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await secondaryPool.end();
    await primaryPool.end();
  }
}

checkPhotos();
