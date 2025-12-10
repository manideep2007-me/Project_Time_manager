const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
// Reuse the same pool config as the server to avoid env mismatches
const pool = require('../src/config/database');

async function listAllProjects() {
  try {
    console.log('📋 All Projects in Database');
    console.log('============================\n');
    
    const result = await pool.query(`
      SELECT 
        p.name, 
        p.status, 
        p.start_date, 
        p.end_date, 
        p.budget, 
        c.name as client_name,
        p.created_at
      FROM projects p 
      JOIN clients c ON p.client_id = c.id 
      ORDER BY p.created_at DESC
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ No projects found in database!');
      return;
    }
    
    result.rows.forEach((project, index) => {
      console.log(`${index + 1}. ${project.name}`);
      console.log(`   Status: ${project.status}`);
      console.log(`   Client: ${project.client_name}`);
      console.log(`   Start: ${project.start_date ? new Date(project.start_date).toLocaleDateString() : 'N/A'}`);
      console.log(`   End: ${project.end_date ? new Date(project.end_date).toLocaleDateString() : 'N/A'}`);
      console.log(`   Budget: $${project.budget ? project.budget.toLocaleString() : 'N/A'}`);
      console.log(`   Created: ${new Date(project.created_at).toLocaleDateString()}`);
      console.log('');
    });
    
    // Group by status
    const statusGroups = {};
    result.rows.forEach(project => {
      if (!statusGroups[project.status]) {
        statusGroups[project.status] = [];
      }
      statusGroups[project.status].push(project.name);
    });
    
    console.log('📊 Projects by Status:');
    console.log('======================');
    Object.keys(statusGroups).sort().forEach(status => {
      console.log(`\n${status.toUpperCase()}: ${statusGroups[status].length} projects`);
      statusGroups[status].forEach(name => {
        console.log(`  • ${name}`);
      });
    });
    
    console.log(`\n✅ Total Projects: ${result.rows.length}`);
    
    await pool.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    await pool.end();
  }
}

listAllProjects();
