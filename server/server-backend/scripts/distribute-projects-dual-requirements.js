const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'project_time_manager',
  password: process.env.DB_PASSWORD || 'Super@123',
  port: process.env.DB_PORT || 5432,
});

async function distributeProjectsDualRequirements() {
  try {
    console.log('🔄 Distributing Projects with Dual Requirements');
    console.log('===============================================');
    console.log('📋 Requirements:');
    console.log('   1. Every project must have at least 2 team members');
    console.log('   2. Every employee must work on at least 3 projects\n');
    
    // Get all active employees
    const employees = await pool.query(`
      SELECT id, first_name, last_name, department, employee_id, hourly_rate
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
    
    if (employees.rows.length < 2) {
      console.log('❌ Need at least 2 employees to satisfy requirements!');
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
    
    // Get admin user for manager_id
    const adminUser = await pool.query('SELECT id FROM users WHERE role = \'admin\' LIMIT 1');
    const adminId = adminUser.rows[0].id;
    
    // Step 1: Ensure every project has at least 2 team members
    console.log('📋 Step 1: Assigning 2 team members to every project...');
    console.log('====================================================');
    
    for (let i = 0; i < projects.rows.length; i++) {
      const project = projects.rows[i];
      console.log(`\n${i + 1}. ${project.name} (${project.status})`);
      
      // Assign 2 employees to this project
      const employee1 = employees.rows[i % employees.rows.length];
      const employee2 = employees.rows[(i + 1) % employees.rows.length];
      
      const assignedEmployees = [employee1, employee2];
      
      for (const employee of assignedEmployees) {
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
        
        console.log(`   ✅ ${employee.first_name} ${employee.last_name} (${employee.department})`);
      }
    }
    
    // Step 2: Ensure every employee works on at least 3 projects
    console.log('\n\n👥 Step 2: Ensuring every employee works on at least 3 projects...');
    console.log('================================================================');
    
    for (const employee of employees.rows) {
      // Count current projects for this employee
      const currentProjects = await pool.query(`
        SELECT COUNT(DISTINCT project_id) as count
        FROM time_entries 
        WHERE employee_id = $1 AND is_active = true
      `, [employee.id]);
      
      const currentCount = currentProjects.rows[0].count;
      const needed = Math.max(0, 3 - currentCount);
      
      console.log(`\n👤 ${employee.first_name} ${employee.last_name} (${employee.department})`);
      console.log(`   Current projects: ${currentCount}`);
      console.log(`   Additional needed: ${needed}`);
      
      if (needed > 0) {
        // Find projects this employee is not already assigned to
        const availableProjects = await pool.query(`
          SELECT p.id, p.name, p.status
          FROM projects p
          WHERE p.status != 'todo' 
          AND p.id NOT IN (
            SELECT DISTINCT project_id 
            FROM time_entries 
            WHERE employee_id = $1 AND is_active = true
          )
          ORDER BY p.id
          LIMIT $2
        `, [employee.id, needed]);
        
        for (const project of availableProjects.rows) {
          const startTime = new Date();
          const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
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
            `Additional project assignment - ${employee.first_name} ${employee.last_name}`
          ]);
          
          console.log(`   ✅ Added: ${project.name} (${project.status})`);
        }
      } else {
        console.log(`   ✅ Already has ${currentCount} projects (requirement satisfied)`);
      }
    }
    
    // Final verification
    console.log('\n\n📊 Final Verification:');
    console.log('======================');
    
    // Check project team sizes
    console.log('\n📋 Project Team Sizes:');
    for (const project of projects.rows) {
      const teamSize = await pool.query(`
        SELECT COUNT(DISTINCT employee_id) as count
        FROM time_entries 
        WHERE project_id = $1 AND is_active = true
      `, [project.id]);
      
      const size = teamSize.rows[0].count;
      const status = size >= 2 ? '✅' : '❌';
      console.log(`   ${status} ${project.name}: ${size} team members`);
    }
    
    // Check employee project counts
    console.log('\n👥 Employee Project Counts:');
    for (const employee of employees.rows) {
      const projectCount = await pool.query(`
        SELECT COUNT(DISTINCT project_id) as count
        FROM time_entries 
        WHERE employee_id = $1 AND is_active = true
      `, [employee.id]);
      
      const count = projectCount.rows[0].count;
      const status = count >= 3 ? '✅' : '❌';
      console.log(`   ${status} ${employee.first_name} ${employee.last_name}: ${count} projects`);
    }
    
    // Show detailed assignments
    console.log('\n📋 Detailed Assignments:');
    console.log('========================');
    
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
    
    // Summary statistics
    const totalAssignments = await pool.query(`
      SELECT COUNT(*) as count
      FROM time_entries 
      WHERE is_active = true
    `);
    
    console.log(`\n🎉 Distribution complete!`);
    console.log(`📈 Total assignments made: ${totalAssignments.rows[0].count}`);
    console.log(`✅ Both requirements satisfied!`);
    
    await pool.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    await pool.end();
  }
}

distributeProjectsDualRequirements();
