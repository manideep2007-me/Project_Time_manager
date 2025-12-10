// Check if employee data is still in database
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'project_time_manager',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
});

async function checkEmployeeData() {
  try {
    console.log('\n📋 Checking Employee Data...\n');
    
    // Check users table
    const usersResult = await pool.query(
      `SELECT id, email, first_name, last_name, role, is_active 
       FROM users 
       ORDER BY role, email`
    );
    
    console.log(`Found ${usersResult.rows.length} users:\n`);
    usersResult.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Name: ${user.first_name} ${user.last_name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.is_active}`);
      console.log('');
    });
    
    // Check employees table (if it exists)
    try {
      const employeesResult = await pool.query(
        `SELECT id, name, position, department, hourly_rate, manager_id
         FROM employees 
         LIMIT 20`
      );
      
      console.log(`\n📊 Employees table: Found ${employeesResult.rows.length} records\n`);
      employeesResult.rows.forEach((emp, index) => {
        console.log(`${index + 1}. ${emp.name}`);
        console.log(`   Position: ${emp.position}`);
        console.log(`   Department: ${emp.department}`);
        console.log(`   Hourly Rate: ${emp.hourly_rate}`);
        console.log('');
      });
    } catch (empError) {
      console.log('ℹ️  Employees table does not exist or has different structure');
    }
    
  } catch (error) {
    console.error('❌ Error checking data:', error);
  } finally {
    await pool.end();
  }
}

checkEmployeeData();
