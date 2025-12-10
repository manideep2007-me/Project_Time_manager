const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'project_time_manager',
  password: process.env.DB_PASSWORD || 'Super@123',
  port: process.env.DB_PORT || 5432,
});

async function assignTeamMembers() {
  try {
    console.log('👥 Project Team Assignment');
    console.log('==========================\n');
    
    // Get all projects except todo
    const projects = await pool.query(`
      SELECT p.id, p.name, p.status, p.client_id
      FROM projects p 
      WHERE p.status != 'todo'
      ORDER BY p.status, p.name
    `);
    
    // Get all employees
    const employees = await pool.query(`
      SELECT id, first_name, last_name, department, employee_id
      FROM employees 
      WHERE is_active = true
      ORDER BY department, first_name
    `);
    
    console.log(`📋 Found ${projects.rows.length} projects (excluding todo)`);
    console.log(`👨‍💼 Found ${employees.rows.length} employees\n`);
    
    // Check current team assignments
    console.log('🔍 Current Team Assignments:');
    console.log('============================');
    
    for (const project of projects.rows) {
      const teamMembers = await pool.query(`
        SELECT DISTINCT e.id, e.first_name, e.last_name, e.department
        FROM time_entries te
        JOIN employees e ON te.employee_id = e.id
        WHERE te.project_id = $1 AND te.is_active = true
      `, [project.id]);
      
      console.log(`\n${project.name} (${project.status})`);
      console.log(`  Team Size: ${teamMembers.rows.length}`);
      
      if (teamMembers.rows.length > 0) {
        teamMembers.rows.forEach(member => {
          console.log(`    • ${member.first_name} ${member.last_name} (${member.department})`);
        });
      } else {
        console.log('    • No team members assigned');
      }
    }
    
    // Assign team members to projects with less than 2 members
    console.log('\n🔄 Assigning Team Members...');
    console.log('============================');
    
    const adminUser = await pool.query('SELECT id FROM users WHERE role = \'admin\' LIMIT 1');
    const adminId = adminUser.rows[0].id;
    
    let assignmentsMade = 0;
    
    for (const project of projects.rows) {
      const currentTeam = await pool.query(`
        SELECT DISTINCT employee_id
        FROM time_entries 
        WHERE project_id = $1 AND is_active = true
      `, [project.id]);
      
      const currentTeamSize = currentTeam.rows.length;
      
      if (currentTeamSize < 2) {
        console.log(`\n📝 ${project.name} needs more team members (current: ${currentTeamSize})`);
        
        // Get available employees (not already assigned to this project)
        const availableEmployees = employees.rows.filter(emp => 
          !currentTeam.rows.some(team => team.employee_id === emp.id)
        );
        
        // Assign employees to reach at least 2 team members
        const needed = 2 - currentTeamSize;
        const toAssign = availableEmployees.slice(0, needed);
        
        for (const employee of toAssign) {
          // Create a time entry to assign the employee to the project
          const startTime = new Date();
          const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour entry
          const durationMinutes = 60;
          const cost = employee.hourly_rate ? employee.hourly_rate : 0;
          
          await pool.query(`
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
            `Initial project assignment - ${employee.first_name} ${employee.last_name}`
          ]);
          
          console.log(`  ✅ Assigned ${employee.first_name} ${employee.last_name} (${employee.department})`);
          assignmentsMade++;
        }
      } else {
        console.log(`✅ ${project.name} already has ${currentTeamSize} team members`);
      }
    }
    
    // Verify final team assignments
    console.log('\n📊 Final Team Assignments:');
    console.log('==========================');
    
    for (const project of projects.rows) {
      const finalTeam = await pool.query(`
        SELECT DISTINCT e.id, e.first_name, e.last_name, e.department
        FROM time_entries te
        JOIN employees e ON te.employee_id = e.id
        WHERE te.project_id = $1 AND te.is_active = true
      `, [project.id]);
      
      console.log(`\n${project.name} (${project.status})`);
      console.log(`  Team Size: ${finalTeam.rows.length}`);
      
      finalTeam.rows.forEach(member => {
        console.log(`    • ${member.first_name} ${member.last_name} (${member.department})`);
      });
    }
    
    console.log(`\n🎉 Team assignment complete!`);
    console.log(`📈 Total assignments made: ${assignmentsMade}`);
    console.log(`✅ All projects now have at least 2 team members!`);
    
    await pool.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    await pool.end();
  }
}

assignTeamMembers();
