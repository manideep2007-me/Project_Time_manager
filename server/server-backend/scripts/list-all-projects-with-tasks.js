const pool = require('../src/config/database');

(async () => {
  try {
    console.log('\n📊 All Projects with Task Counts:\n');
    console.log('═'.repeat(80));
    
    const projectsRes = await pool.query(
      `SELECT 
        p.id,
        p.name,
        p.status,
        c.name as client_name,
        COUNT(t.id) as task_count
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN tasks t ON t.project_id = p.id
      GROUP BY p.id, p.name, p.status, c.name
      ORDER BY p.name`
    );
    
    if (projectsRes.rows.length === 0) {
      console.log('No projects found.');
    } else {
      projectsRes.rows.forEach((project, idx) => {
        console.log(`${idx + 1}. ${project.name}`);
        console.log(`   ├─ Client: ${project.client_name || 'N/A'}`);
        console.log(`   ├─ Status: ${project.status}`);
        console.log(`   └─ Tasks: ${project.task_count}`);
        console.log('');
      });
      
      console.log('═'.repeat(80));
      console.log(`\nTotal Projects: ${projectsRes.rows.length}`);
      
      const totalTasks = projectsRes.rows.reduce((sum, p) => sum + parseInt(p.task_count), 0);
      console.log(`Total Tasks: ${totalTasks}\n`);
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
})();
