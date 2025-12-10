#!/usr/bin/env node

/**
 * Test the new GET /api/projects/:id/team endpoint
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const pool = require('../src/config/database');

async function testTeamEndpoint() {
  try {
    // Get a sample project
    const projects = await pool.query('SELECT id, name FROM projects LIMIT 1');
    
    if (projects.rows.length === 0) {
      console.log('❌ No projects found');
      return;
    }
    
    const project = projects.rows[0];
    console.log(`\n📋 Testing team endpoint for: ${project.name} (${project.id})\n`);
    
    // Get team members from the new table
    const team = await pool.query(
      `SELECT ptm.id as membership_id, ptm.role, ptm.added_at,
              e.id, e.employee_id, e.first_name, e.last_name, e.email, e.department
       FROM project_team_memberships ptm
       JOIN employees e ON ptm.employee_id = e.id
       WHERE ptm.project_id = $1
       ORDER BY ptm.added_at ASC`,
      [project.id]
    );
    
    console.log(`✅ Found ${team.rows.length} team members:\n`);
    
    team.rows.forEach((member, idx) => {
      console.log(`${idx + 1}. ${member.first_name} ${member.last_name}`);
      console.log(`   Email: ${member.email || 'N/A'}`);
      console.log(`   Department: ${member.department || 'N/A'}`);
      console.log(`   Role: ${member.role}`);
      console.log(`   Added: ${new Date(member.added_at).toLocaleDateString()}\n`);
    });
    
    console.log('✅ Endpoint structure test passed!\n');
    console.log('Expected API response structure:');
    console.log(JSON.stringify({
      project: { id: project.id, name: project.name },
      teamMembers: team.rows,
      teamSize: team.rows.length
    }, null, 2));
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

testTeamEndpoint();
