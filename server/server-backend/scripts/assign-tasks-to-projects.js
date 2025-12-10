const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

async function assignTasksToProjects() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'project_time_manager',
  });

  try {
    console.log('🎯 Assigning tasks to projects and team members...');
    
    // Get all projects
    const projectsResult = await pool.query('SELECT id, name, status FROM projects ORDER BY name');
    const projects = projectsResult.rows;
    console.log(`📋 Found ${projects.length} projects`);
    
    // Get all employees
    const employeesResult = await pool.query('SELECT id, first_name, last_name FROM employees ORDER BY first_name');
    const employees = employeesResult.rows;
    console.log(`👥 Found ${employees.length} employees`);
    
    if (employees.length === 0) {
      console.log('❌ No employees found. Cannot assign tasks.');
      return;
    }
    
    // Clear existing tasks
    console.log('🧹 Clearing existing tasks...');
    await pool.query('DELETE FROM tasks');
    
    // Task templates for different project types
    const taskTemplates = {
      'active': [
        'Project kickoff and planning',
        'Requirements gathering and analysis',
        'System architecture design',
        'Database schema design',
        'API development and testing',
        'Frontend development',
        'Backend integration',
        'Quality assurance testing',
        'Performance optimization',
        'Documentation and deployment'
      ],
      'todo': [
        'Initial project setup',
        'Team onboarding and training',
        'Technology stack selection',
        'Development environment setup',
        'Project timeline planning',
        'Resource allocation planning'
      ],
      'completed': [
        'Final testing and validation',
        'Production deployment',
        'User acceptance testing',
        'Project documentation',
        'Knowledge transfer',
        'Project closure and handover'
      ],
      'on_hold': [
        'Issue investigation and analysis',
        'Stakeholder communication',
        'Risk assessment and mitigation',
        'Alternative solution research',
        'Project scope review'
      ],
      'pending': [
        'Project approval and funding',
        'Resource allocation confirmation',
        'Timeline finalization',
        'Stakeholder alignment',
        'Contract and legal review'
      ],
      'cancelled': [
        'Project termination analysis',
        'Resource reallocation',
        'Lessons learned documentation',
        'Stakeholder notification',
        'Cleanup and archiving'
      ]
    };
    
    // Status distribution for tasks
    const statusDistribution = {
      'todo': 0.3,      // 30% todo
      'in_progress': 0.4, // 40% in progress
      'done': 0.2,      // 20% done
      'overdue': 0.1    // 10% overdue
    };
    
    const statuses = Object.keys(statusDistribution);
    
    let totalTasksCreated = 0;
    
    // Assign tasks to each project
    for (const project of projects) {
      const projectStatus = project.status;
      const templates = taskTemplates[projectStatus] || taskTemplates['active'];
      
      // Determine number of tasks for this project (3-8 tasks per project)
      const taskCount = Math.floor(Math.random() * 6) + 3; // 3-8 tasks
      
      console.log(`\n📝 Creating ${taskCount} tasks for "${project.name}" (${projectStatus})`);
      
      for (let i = 0; i < taskCount; i++) {
        // Select a random task template
        const taskTitle = templates[Math.floor(Math.random() * templates.length)];
        
        // Select a random employee
        const assignedEmployee = employees[Math.floor(Math.random() * employees.length)];
        
        // Select status based on distribution
        const random = Math.random();
        let cumulative = 0;
        let selectedStatus = 'todo';
        
        for (const [status, probability] of Object.entries(statusDistribution)) {
          cumulative += probability;
          if (random <= cumulative) {
            selectedStatus = status;
            break;
          }
        }
        
        // Calculate due date (1-30 days from now)
        const daysFromNow = Math.floor(Math.random() * 30) + 1;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + daysFromNow);
        
        // Insert task
        await pool.query(
          `INSERT INTO tasks (project_id, title, status, assigned_to, due_date, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
          [project.id, taskTitle, selectedStatus, assignedEmployee.id, dueDate.toISOString().split('T')[0]]
        );
        
        totalTasksCreated++;
        console.log(`  ✅ "${taskTitle}" → ${assignedEmployee.first_name} ${assignedEmployee.last_name} (${selectedStatus})`);
      }
    }
    
    // Verify task distribution
    console.log('\n📊 Task distribution by project:');
    const distributionResult = await pool.query(`
      SELECT p.name as project_name, COUNT(t.id) as task_count
      FROM projects p 
      LEFT JOIN tasks t ON p.id = t.project_id 
      GROUP BY p.id, p.name 
      ORDER BY task_count DESC, p.name
    `);
    
    distributionResult.rows.forEach(row => {
      console.log(`  - ${row.project_name}: ${row.task_count} tasks`);
    });
    
    // Task distribution by status
    console.log('\n📈 Task distribution by status:');
    const statusResult = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM tasks 
      GROUP BY status 
      ORDER BY count DESC
    `);
    
    statusResult.rows.forEach(row => {
      console.log(`  - ${row.status}: ${row.count} tasks`);
    });
    
    // Task distribution by employee
    console.log('\n👤 Task distribution by employee:');
    const employeeResult = await pool.query(`
      SELECT e.first_name, e.last_name, COUNT(t.id) as task_count
      FROM employees e 
      LEFT JOIN tasks t ON e.id = t.assigned_to 
      GROUP BY e.id, e.first_name, e.last_name 
      ORDER BY task_count DESC
    `);
    
    employeeResult.rows.forEach(row => {
      console.log(`  - ${row.first_name} ${row.last_name}: ${row.task_count} tasks`);
    });
    
    console.log(`\n🎉 Successfully created ${totalTasksCreated} tasks across ${projects.length} projects!`);
    console.log('✅ Tasks are now assigned to team members and will appear in "My Tasks" section');
    
  } catch (err) {
    console.error('❌ Error assigning tasks:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

assignTasksToProjects();
