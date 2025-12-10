const pool = require('../src/config/database');

(async () => {
  try {
    console.log('\n📊 Complete Hierarchy: Clients → Projects → Tasks\n');
    console.log('═'.repeat(100));
    
    // Get all clients with their projects and tasks
    const clientsRes = await pool.query(
      `SELECT 
        c.id as client_id,
        c.name as client_name,
        c.email,
        c.phone
      FROM clients c
      ORDER BY c.name`
    );
    
    if (clientsRes.rows.length === 0) {
      console.log('No clients found.');
      return;
    }
    
    let totalProjects = 0;
    let totalTasks = 0;
    
    for (let i = 0; i < clientsRes.rows.length; i++) {
      const client = clientsRes.rows[i];
      
      // Get projects for this client
      const projectsRes = await pool.query(
        `SELECT 
          p.id as project_id,
          p.name as project_name,
          p.status as project_status
        FROM projects p
        WHERE p.client_id = $1
        ORDER BY p.name`,
        [client.client_id]
      );
      
      const contactInfo = [];
      if (client.email) contactInfo.push(client.email);
      if (client.phone) contactInfo.push(client.phone);
      const contact = contactInfo.length > 0 ? ` | ${contactInfo.join(' | ')}` : '';
      
      console.log(`\n${i + 1}) 👤 ${client.client_name}${contact}`);
      
      if (projectsRes.rows.length === 0) {
        console.log('   └─ No projects');
      } else {
        totalProjects += projectsRes.rows.length;
        
        for (let j = 0; j < projectsRes.rows.length; j++) {
          const project = projectsRes.rows[j];
          
          // Get tasks for this project
          const tasksRes = await pool.query(
            `SELECT 
              t.id as task_id,
              t.title as task_title,
              t.status as task_status,
              t.due_date,
              t.approved,
              CONCAT(e.first_name, ' ', e.last_name) as assigned_to
            FROM tasks t
            LEFT JOIN employees e ON t.assigned_to = e.id
            WHERE t.project_id = $1
            ORDER BY t.created_at DESC`,
            [project.project_id]
          );
          
          const isLastProject = j === projectsRes.rows.length - 1;
          const projectPrefix = isLastProject ? '   └─' : '   ├─';
          
          console.log(`${projectPrefix} 📁 ${project.project_name} [${project.project_status}]`);
          
          if (tasksRes.rows.length === 0) {
            const emptyPrefix = isLastProject ? '      ' : '   │  ';
            console.log(`${emptyPrefix}   └─ No tasks`);
          } else {
            totalTasks += tasksRes.rows.length;
            
            for (let k = 0; k < tasksRes.rows.length; k++) {
              const task = tasksRes.rows[k];
              const isLastTask = k === tasksRes.rows.length - 1;
              const taskPrefix = isLastProject ? '      ' : '   │  ';
              const taskBranch = isLastTask ? '└─' : '├─';
              
              const approvedIcon = task.approved ? '✅' : '⏳';
              const assignedInfo = task.assigned_to ? ` (${task.assigned_to})` : ' (Unassigned)';
              const dueDateInfo = task.due_date ? ` | Due: ${new Date(task.due_date).toLocaleDateString()}` : '';
              
              console.log(`${taskPrefix}   ${taskBranch} ${approvedIcon} ${task.task_title} [${task.task_status}]${assignedInfo}${dueDateInfo}`);
            }
          }
        }
      }
    }
    
    console.log('\n' + '═'.repeat(100));
    console.log(`\n📈 Summary:`);
    console.log(`   • Total Clients: ${clientsRes.rows.length}`);
    console.log(`   • Total Projects: ${totalProjects}`);
    console.log(`   • Total Tasks: ${totalTasks}`);
    console.log('');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
})();
