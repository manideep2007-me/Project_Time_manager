#!/usr/bin/env node

/**
 * Auto-assign 2-3 employees to all projects using the new project_team_memberships table.
 * Prioritizes projects with 0 team members, then ensures all have at least 2, max 3.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const pool = require('../src/config/database');

async function autoAssignTeams() {
  const client = await pool.connect();
  
  try {
    console.log('🎯 Auto-Assigning Project Teams (2-3 employees per project)');
    console.log('=============================================================\n');

    await client.query('BEGIN');

    // Get all projects
    const projects = await client.query(`
      SELECT p.id, p.name, p.status
      FROM projects p
      ORDER BY p.created_at DESC
    `);

    // Get all active employees
    const employees = await client.query(`
      SELECT id, first_name, last_name, email, department
      FROM employees
      WHERE is_active = true
      ORDER BY first_name, last_name
    `);

    const employeeList = employees.rows;
    const totalEmployees = employeeList.length;

    if (totalEmployees === 0) {
      console.log('❌ No active employees found. Cannot assign teams.');
      await client.query('ROLLBACK');
      return;
    }

    console.log(`📋 Projects: ${projects.rows.length}`);
    console.log(`👥 Active Employees: ${totalEmployees}\n`);

    let totalAssignments = 0;
    let employeeIndex = 0;

    for (const project of projects.rows) {
      const { id: projectId, name, status } = project;

      // Check current team size
      const currentTeam = await client.query(
        'SELECT employee_id FROM project_team_memberships WHERE project_id = $1',
        [projectId]
      );

      const currentSize = currentTeam.rows.length;
      const targetSize = 2; // Minimum 2, can go up to 3
      const maxSize = 3;

      console.log(`\n📁 ${name} (${status})`);
      console.log(`   Current team size: ${currentSize}`);

      if (currentSize >= targetSize) {
        console.log(`   ✅ Already has sufficient team members (${currentSize})`);
        continue;
      }

      const needed = Math.min(maxSize, targetSize) - currentSize;
      console.log(`   🔄 Adding ${needed} team member(s)...`);

      const currentEmployeeIds = currentTeam.rows.map(m => m.employee_id);

      let assigned = 0;
      let attempts = 0;
      const maxAttempts = totalEmployees * 2; // Prevent infinite loop

      while (assigned < needed && attempts < maxAttempts) {
        const employee = employeeList[employeeIndex % totalEmployees];
        employeeIndex++;
        attempts++;

        // Skip if already on this project
        if (currentEmployeeIds.includes(employee.id)) {
          continue;
        }

        // Add to team
        await client.query(
          `INSERT INTO project_team_memberships (project_id, employee_id, role)
           VALUES ($1, $2, $3)
           ON CONFLICT (project_id, employee_id) DO NOTHING`,
          [projectId, employee.id, 'member']
        );

        console.log(`   ✅ Added: ${employee.first_name} ${employee.last_name} (${employee.department || 'N/A'})`);
        currentEmployeeIds.push(employee.id);
        assigned++;
        totalAssignments++;
      }
    }

    await client.query('COMMIT');

    console.log('\n📊 Final Team Assignments:');
    console.log('===========================\n');

    for (const project of projects.rows) {
      const finalTeam = await client.query(
        `SELECT e.first_name, e.last_name, e.department, ptm.role, ptm.added_at
         FROM project_team_memberships ptm
         JOIN employees e ON ptm.employee_id = e.id
         WHERE ptm.project_id = $1
         ORDER BY ptm.added_at ASC`,
        [project.id]
      );

      console.log(`${project.name}`);
      console.log(`  Team Size: ${finalTeam.rows.length}`);
      if (finalTeam.rows.length > 0) {
        finalTeam.rows.forEach((member, idx) => {
          console.log(`    ${idx + 1}. ${member.first_name} ${member.last_name} (${member.department || 'N/A'}) - ${member.role}`);
        });
      } else {
        console.log('    (No team members)');
      }
      console.log('');
    }

    console.log(`\n🎉 Team assignment completed!`);
    console.log(`📈 Total assignments made: ${totalAssignments}`);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', err.message);
    console.error(err);
  } finally {
    client.release();
    await pool.end();
  }
}

autoAssignTeams();
