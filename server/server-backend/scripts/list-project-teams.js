#!/usr/bin/env node

/**
 * Lists projects and their assigned team (2–3 employees) and prints a Markdown table.
 * Team members are inferred from:
 *  1) tasks.assigned_to for tasks within the project
 *  2) time_entries joined via task_id -> tasks.project_id OR direct te.project_id when available
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const pool = require('../src/config/database');

async function listTeams() {
  try {
    const projects = await pool.query(
      `SELECT p.id, p.name
       FROM projects p
       ORDER BY p.created_at DESC`
    );

    const rows = projects.rows;

    const results = [];

    for (const p of rows) {
      const { id: projectId, name } = p;

      // Pull distinct employees tied to this project via tasks or time entries
      const team = await pool.query(
        `SELECT DISTINCT e.id, e.first_name, e.last_name
         FROM employees e
         WHERE e.id IN (
           SELECT DISTINCT t.assigned_to
           FROM tasks t
           WHERE t.project_id = $1 AND t.assigned_to IS NOT NULL
           UNION
           SELECT DISTINCT te.employee_id
           FROM time_entries te
           JOIN tasks t2 ON te.task_id = t2.id
           WHERE t2.project_id = $1
         )
         ORDER BY e.first_name, e.last_name`,
        [projectId]
      );

      // Format names and limit to 3 for the report
      const names = team.rows.map(e => `${e.first_name} ${e.last_name}`.trim());
      const assigned = names.slice(0, 3);

      results.push({ name, team: assigned });
    }

    // Print Markdown table
    console.log('| Project Name | Assigned Team (2-3 employees) |');
    console.log('| --- | --- |');
    for (const r of results) {
      const teamDisplay = r.team.length > 0 ? r.team.join(', ') : '—';
      console.log(`| ${r.name.replace(/\|/g, '\\|')} | ${teamDisplay.replace(/\|/g, '\\|')} |`);
    }
  } catch (err) {
    console.error('Error listing project teams:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

listTeams();
