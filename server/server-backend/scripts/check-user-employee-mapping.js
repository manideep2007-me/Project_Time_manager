// Check if users exist in employees table
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'project_time_manager',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
});

async function checkUserEmployeeMapping() {
  try {
    console.log('\n🔍 Checking User-Employee Mapping...\n');
    
    // Get all users
    const usersResult = await pool.query(
      `SELECT id, email, first_name, last_name, role 
       FROM users 
       WHERE role IN ('employee', 'manager')
       ORDER BY role, email`
    );
    
    console.log(`Found ${usersResult.rows.length} users (employees/managers):\n`);
    
    // Check if employees table exists and has matching records
    for (const user of usersResult.rows) {
      console.log(`👤 ${user.email} (${user.first_name} ${user.last_name})`);
      console.log(`   User ID: ${user.id}`);
      console.log(`   Role: ${user.role}`);
      
      // Check if this user exists in employees table
      try {
        const empResult = await pool.query(
          `SELECT id, name, position, department, hourly_rate 
           FROM employees 
           WHERE id = $1`,
          [user.id]
        );
        
        if (empResult.rows.length > 0) {
          const emp = empResult.rows[0];
          console.log(`   ✅ EXISTS in employees table`);
          console.log(`      Name: ${emp.name}`);
          console.log(`      Position: ${emp.position}`);
          console.log(`      Department: ${emp.department}`);
        } else {
          console.log(`   ❌ NOT FOUND in employees table`);
        }
      } catch (empError) {
        console.log(`   ⚠️  Error checking employees table:`, empError.message);
      }
      console.log('');
    }
    
    // Check if employees table exists at all
    console.log('\n📊 Checking employees table structure...\n');
    try {
      const tableCheck = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'employees' 
        ORDER BY ordinal_position
      `);
      
      if (tableCheck.rows.length === 0) {
        console.log('❌ Employees table does NOT exist!');
      } else {
        console.log('✅ Employees table structure:');
        tableCheck.rows.forEach(col => {
          console.log(`   - ${col.column_name}: ${col.data_type}`);
        });
      }
    } catch (err) {
      console.log('❌ Error checking table:', err.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkUserEmployeeMapping();
