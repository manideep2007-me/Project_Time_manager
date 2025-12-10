const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'project_time_manager',
  password: process.env.DB_PASSWORD || 'Super@123',
  port: process.env.DB_PORT || 5432,
});

async function distributeProjectsEqually() {
  try {
    console.log('🔄 Distributing Projects Equally Among Employees');
    console.log('================================================\n');
    
    // Get all active employees
    const employees = await pool.query(`
      SELECT id, first_name, last_name, department, employee_id
      FROM employees 
      WHERE is_active = true
      ORDER BY id
    `);
    
    // Get all projects (excluding todo)
    const projects = await pool.query(`
      SELECT id, name, status, client_id
      FROM projects 
      WHERE status != 'todo'
      ORDER BY id
    `);
    
    console.log(`👥 Found ${employees.rows.length} active employees`);
    console.log(`📋 Found ${projects.rows.length} projects (excluding todo)\n`);
    
    if (employees.rows.length === 0) {
      console.log('❌ No active employees found!');
      return;
    }
    
    if (projects.rows.length === 0) {
      console.log('❌ No projects found!');
      return;
    }
    
    // Clear existing time entries for projects (to start fresh)
    console.log('🧹 Clearing existing project assignments...');
    await pool.query('DELETE FROM time_entries WHERE is_active = true');
    console.log('✅ Cleared existing assignments\n');
    
    // Calculate distribution
    const projectsPerEmployee = Math.floor(projects.rows.length / employees.rows.length);
    const remainingProjects = projects.rows.length % employees.rows.length;
    
    console.log(`📊 Distribution Plan:`);
    console.log(`   Base projects per employee: ${projectsPerEmployee}`);
    console.log(`   Extra projects for first ${remainingProjects} employees: 1 additional\n`);
    
    // Get admin user for manager_id
    const adminUser = await pool.query('SELECT id FROM users WHERE role = \'admin\' LIMIT 1');
    const adminId = adminUser.rows[0].id;
    
    let projectIndex = 0;
    let totalAssignments = 0;
    
    // Distribute projects equally
    for (let i = 0; i < employees.rows.length; i++) {
      const employee = employees.rows[i];
      const extraProject = i < remainingProjects ? 1 : 0;
      const employeeProjectCount = projectsPerEmployee + extraProject;
      
      console.log(`👤 ${employee.first_name} ${employee.last_name} (${employee.department})`);
      console.log(`   Projects to assign: ${employeeProjectCount}`);
      
      const employeeProjects = [];
      
      // Assign projects to this employee
      for (let j = 0; j < employeeProjectCount && projectIndex < projects.rows.length; j++) {
        const project = projects.rows[projectIndex];
        employeeProjects.push(project);
        projectIndex++;
      }
      
      // Create time entries for each project
      for (const project of employeeProjects) {
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
          `Project assignment - ${employee.first_name} ${employee.last_name}`
        ]);
        
        console.log(`     ✅ ${project.name} (${project.status})`);
        totalAssignments++;
      }
      
      console.log(`   Total assigned: ${employeeProjects.length} projects\n`);
    }
    
    // Verify distribution
    console.log('📊 Final Distribution Summary:');
    console.log('==============================');
    
    for (const employee of employees.rows) {
      const assignedProjects = await pool.query(`
        SELECT DISTINCT p.name, p.status
        FROM time_entries te
        JOIN projects p ON te.project_id = p.id
        WHERE te.employee_id = $1 AND te.is_active = true
        ORDER BY p.name
      `, [employee.id]);
      
      console.log(`\n${employee.first_name} ${employee.last_name}: ${assignedProjects.rows.length} projects`);
      assignedProjects.rows.forEach(project => {
        console.log(`  • ${project.name} (${project.status})`);
      });
    }
    
    // Show project status distribution
    console.log('\n📈 Project Status Distribution:');
    const statusDistribution = await pool.query(`
      SELECT p.status, COUNT(DISTINCT p.id) as project_count, COUNT(DISTINCT te.employee_id) as employee_count
      FROM projects p
      LEFT JOIN time_entries te ON p.id = te.project_id AND te.is_active = true
      WHERE p.status != 'todo'
      GROUP BY p.status
      ORDER BY p.status
    `);
    
    statusDistribution.rows.forEach(row => {
      console.log(`  ${row.status}: ${row.project_count} projects, ${row.employee_count} employees assigned`);
    });
    
    console.log(`\n🎉 Distribution complete!`);
    console.log(`📈 Total assignments made: ${totalAssignments}`);
    console.log(`✅ All projects now have equal distribution among employees!`);
    
    await pool.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    await pool.end();
  }
}

distributeProjectsEqually();
