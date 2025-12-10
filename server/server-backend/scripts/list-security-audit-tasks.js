const pool = require('../src/config/database');

(async () => {
  try {
    // Find the Security Audit project
    const projectRes = await pool.query(
      `SELECT id, name FROM projects WHERE name ILIKE '%Security Audit%'`
    );
    
    if (projectRes.rows.length === 0) {
      console.log('❌ No project found with name containing "Security Audit"');
      return;
    }
    
    const project = projectRes.rows[0];
    console.log(`\n📋 Project: ${project.name}`);
    console.log(`   ID: ${project.id}\n`);
    console.log('═'.repeat(80));
    
    // Get all tasks for this project
    const tasksRes = await pool.query(
      `SELECT 
        t.id,
        t.title,
        t.status,
        t.due_date,
        t.approved,
        t.created_at,
        CONCAT(e.first_name, ' ', e.last_name) as assigned_to,
        e.email as assignee_email
      FROM tasks t
      LEFT JOIN employees e ON t.assigned_to = e.id
      WHERE t.project_id = $1
      ORDER BY t.created_at DESC`,
      [project.id]
    );
    
    if (tasksRes.rows.length === 0) {
      console.log('\n⚠️  No tasks found for this project.\n');
    } else {
      console.log(`\n✅ Total Tasks: ${tasksRes.rows.length}\n`);
      
      tasksRes.rows.forEach((task, idx) => {
        console.log(`${idx + 1}. 📌 ${task.title}`);
        console.log(`   ├─ Task ID: ${task.id}`);
        console.log(`   ├─ Status: ${task.status || 'N/A'}`);
        console.log(`   ├─ Assigned to: ${task.assigned_to || 'Unassigned'}`);
        if (task.assignee_email) {
          console.log(`   ├─ Email: ${task.assignee_email}`);
        }
        console.log(`   ├─ Due Date: ${task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}`);
        console.log(`   ├─ Approved: ${task.approved ? '✅ Yes' : '❌ No'}`);
        console.log(`   └─ Created: ${task.created_at ? new Date(task.created_at).toLocaleString() : 'N/A'}`);
        console.log('');
      });
      
      console.log('═'.repeat(80));
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
})();
