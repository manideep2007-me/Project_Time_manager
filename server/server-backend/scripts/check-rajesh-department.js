const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'project_time_manager',
  password: process.env.DB_PASSWORD || 'Super@123',
  port: process.env.DB_PORT || 5432,
});

async function checkRajeshDepartment() {
  try {
    console.log('🔍 Checking Rajesh Kumar employee record...\n');
    
    const result = await pool.query(
      `SELECT id, employee_id, first_name, last_name, department, salary_amount, salary_type, is_active 
       FROM employees 
       WHERE first_name ILIKE '%Rajesh%' OR last_name ILIKE '%Kumar%'`
    );
    
    if (result.rows.length === 0) {
      console.log('❌ No employee record found for Rajesh Kumar');
      console.log('\n📝 Checking users table instead...\n');
      
      const userResult = await pool.query(
        `SELECT id, email, first_name, last_name, role 
         FROM users 
         WHERE first_name ILIKE '%Rajesh%' OR last_name ILIKE '%Kumar%' OR email LIKE '%rajesh%'`
      );
      
      if (userResult.rows.length > 0) {
        console.log('✅ Found user record(s):');
        console.log(JSON.stringify(userResult.rows, null, 2));
        console.log('\n⚠️  User exists but NO employee record found!');
        console.log('💡 Rajesh Kumar has a user account but not an employee record in the employees table.');
      } else {
        console.log('❌ No user record found either');
      }
    } else {
      console.log('✅ Found employee record(s):');
      console.log(JSON.stringify(result.rows, null, 2));
      
      result.rows.forEach(emp => {
        console.log(`\n👤 ${emp.first_name} ${emp.last_name}`);
        console.log(`   Department: ${emp.department || 'NOT SET'}`);
        console.log(`   Employee ID: ${emp.employee_id}`);
        console.log(`   Salary: ${emp.salary_amount || 'NOT SET'}`);
        console.log(`   Active: ${emp.is_active}`);
      });
    }
    
    await pool.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    await pool.end();
  }
}

checkRajeshDepartment();
