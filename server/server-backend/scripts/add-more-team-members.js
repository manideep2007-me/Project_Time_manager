#!/usr/bin/env node

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  database: process.env.DB_NAME || 'project_time_manager',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function addMoreTeamMembers() {
  const client = await pool.connect();
  
  try {
    console.log('👥 Adding More Team Members to Projects');
    console.log('=====================================\n');
    
    // Get all active projects
    const projects = await client.query(`
      SELECT id, name, status 
      FROM projects 
      WHERE status IN ('active', 'pending')
      ORDER BY name
    `);
    
    // Get all employees
    const employees = await client.query(`
      SELECT id, first_name, last_name, department, hourly_rate
      FROM employees 
      WHERE is_active = true
      ORDER BY department, first_name
    `);
    
    // Get admin user for manager_id
    const adminUser = await client.query(`
      SELECT id FROM users WHERE role = 'admin' LIMIT 1
    `);
    const adminId = adminUser.rows[0].id;
    
    console.log(`📋 Found ${projects.rows.length} active/pending projects`);
    console.log(`👨‍💼 Found ${employees.rows.length} employees\n`);
    
    for (const project of projects.rows) {
      console.log(`\n🔍 Processing: ${project.name} (${project.status})`);
      
      // Get current team members for this project
      const currentTeam = await client.query(`
        SELECT DISTINCT e.id, e.first_name, e.last_name
        FROM time_entries te
        JOIN employees e ON te.employee_id = e.id
        WHERE te.project_id = $1 AND te.is_active = true
      `, [project.id]);
      
      console.log(`   Current team size: ${currentTeam.rows.length}`);
      
      // Add 2-3 more employees to each project (up to 4-5 total)
      const targetTeamSize = Math.min(5, employees.rows.length);
      const additionalMembersNeeded = Math.max(0, targetTeamSize - currentTeam.rows.length);
      
      if (additionalMembersNeeded > 0) {
        console.log(`   Adding ${additionalMembersNeeded} more team members...`);
        
        // Get employees not already on this project
        const currentEmployeeIds = currentTeam.rows.map(emp => emp.id);
        const availableEmployees = employees.rows.filter(emp => !currentEmployeeIds.includes(emp.id));
        
        // Add additional employees
        for (let i = 0; i < Math.min(additionalMembersNeeded, availableEmployees.length); i++) {
          const employee = availableEmployees[i];
          
          // Create a time entry to assign the employee to the project
          const startTime = new Date();
          const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour entry
          const durationMinutes = 60;
          const cost = employee.hourly_rate || 0;
          
          await client.query(`
            INSERT INTO time_entries (project_id, employee_id, manager_id, start_time, end_time, duration_minutes, cost, description, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
          `, [
            project.id,
            employee.id,
            adminId,
            startTime,
            endTime,
            durationMinutes,
            cost,
            `Team assignment - ${employee.first_name} ${employee.last_name}`
          ]);
          
          console.log(`   ✅ Added ${employee.first_name} ${employee.last_name} (${employee.department})`);
        }
      } else {
        console.log(`   ✅ Already has ${currentTeam.rows.length} team members`);
      }
    }
    
    // Show final team assignments
    console.log('\n📊 Final Team Assignments:');
    console.log('==========================');
    
    for (const project of projects.rows) {
      const finalTeam = await client.query(`
        SELECT DISTINCT e.id, e.first_name, e.last_name, e.department
        FROM time_entries te
        JOIN employees e ON te.employee_id = e.id
        WHERE te.project_id = $1 AND te.is_active = true
        ORDER BY e.first_name
      `, [project.id]);
      
      console.log(`\n${project.name} (${project.status})`);
      console.log(`  Team Size: ${finalTeam.rows.length}`);
      finalTeam.rows.forEach(member => {
        console.log(`    • ${member.first_name} ${member.last_name} (${member.department})`);
      });
    }
    
    console.log('\n🎉 Team member addition completed successfully!');
    
  } catch (error) {
    console.error('❌ Error adding team members:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
addMoreTeamMembers()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
