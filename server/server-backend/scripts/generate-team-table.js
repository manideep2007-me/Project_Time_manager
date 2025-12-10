#!/usr/bin/env node

/**
 * Generate a Markdown table showing Project Name and Assigned Team (2-3 employees)
 * from the project_team_memberships table.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const pool = require('../src/config/database');

async function generateTeamTable() {
  try {
    const projects = await pool.query(
      `SELECT p.id, p.name
       FROM projects p
       ORDER BY p.created_at DESC`
    );

    const results = [];

    for (const p of projects.rows) {
      const { id: projectId, name } = p;

      // Get team members from the new table
      const team = await pool.query(
        `SELECT e.first_name, e.last_name
         FROM project_team_memberships ptm
         JOIN employees e ON ptm.employee_id = e.id
         WHERE ptm.project_id = $1
         ORDER BY ptm.added_at ASC`,
        [projectId]
      );

      const names = team.rows.map(e => `${e.first_name} ${e.last_name}`.trim());
      results.push({ name, team: names });
    }

    // Print Markdown table
    console.log('| Project Name | Assigned Team (2-3 employees) |');
    console.log('| --- | --- |');
    for (const r of results) {
      const teamDisplay = r.team.length > 0 ? r.team.join(', ') : '—';
      console.log(`| ${r.name.replace(/\|/g, '\\|')} | ${teamDisplay.replace(/\|/g, '\\|')} |`);
    }
  } catch (err) {
    console.error('Error generating team table:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

generateTeamTable();
