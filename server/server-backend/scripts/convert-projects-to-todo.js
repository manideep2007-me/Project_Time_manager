const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'project_time_manager',
  password: process.env.DB_PASSWORD || 'Super@123',
  port: process.env.DB_PORT || 5432,
});

async function convertProjectsToTodo() {
  try {
    console.log('🔄 Converting active projects to todo projects...\n');
    
    // First, let's see the current active projects
    console.log('📋 Current active projects:');
    const activeProjects = await pool.query(
      'SELECT id, name, status, client_id FROM projects WHERE status = $1 ORDER BY created_at LIMIT 5',
      ['active']
    );
    
    if (activeProjects.rows.length === 0) {
      console.log('❌ No active projects found!');
      await pool.end();
      return;
    }
    
    activeProjects.rows.forEach((project, index) => {
      console.log(`${index + 1}. ${project.name} (ID: ${project.id})`);
    });
    
    // Convert the first two active projects to todo
    const projectsToConvert = activeProjects.rows.slice(0, 2);
    
    console.log(`\n🔄 Converting ${projectsToConvert.length} projects to 'todo' status...\n`);
    
    for (const project of projectsToConvert) {
      await pool.query(
        'UPDATE projects SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['todo', project.id]
      );
      console.log(`✅ Converted: ${project.name} → todo`);
    }
    
    // Verify the changes
    console.log('\n📊 Updated project status:');
    const updatedProjects = await pool.query(
      'SELECT id, name, status FROM projects WHERE id = ANY($1) ORDER BY name',
      [projectsToConvert.map(p => p.id)]
    );
    
    updatedProjects.rows.forEach(project => {
      console.log(`   ${project.name}: ${project.status}`);
    });
    
    // Show overall project status summary
    console.log('\n📈 Project Status Summary:');
    const statusSummary = await pool.query(
      'SELECT status, COUNT(*) as count FROM projects GROUP BY status ORDER BY status'
    );
    
    statusSummary.rows.forEach(row => {
      console.log(`   ${row.status}: ${row.count} projects`);
    });
    
    console.log('\n🎉 Successfully converted projects to todo status!');
    
    await pool.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    await pool.end();
  }
}

convertProjectsToTodo();
