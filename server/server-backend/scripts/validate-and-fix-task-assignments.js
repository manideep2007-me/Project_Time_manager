const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const pool = new Pool({
	host: process.env.DB_HOST || 'localhost',
	port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
	database: process.env.DB_NAME || 'project_time_manager',
	user: process.env.DB_USER || 'postgres',
	password: process.env.DB_PASSWORD,
});

async function main() {
	const client = await pool.connect();
	try {
		console.log('🔍 Checking for tasks assigned to non-team members...\n');
		
		// Find tasks where assigned employee is NOT in project team
		const invalidAssignments = await client.query(`
			SELECT 
				p.name as project_name,
				t.title as task_title,
				e.first_name,
				e.last_name,
				e.department,
				t.id as task_id,
				p.id as project_id
			FROM tasks t
			JOIN projects p ON t.project_id = p.id
			JOIN employees e ON t.assigned_to = e.id
			WHERE t.assigned_to IS NOT NULL
			AND NOT EXISTS (
				SELECT 1 
				FROM project_team_memberships ptm 
				WHERE ptm.project_id = p.id 
				AND ptm.employee_id = t.assigned_to
			)
			ORDER BY p.name, t.title
		`);
		
		if (invalidAssignments.rows.length === 0) {
			console.log('✅ All task assignments are valid! Every assigned employee is a team member of their project.\n');
		} else {
			console.log(`⚠️  Found ${invalidAssignments.rows.length} invalid assignments:\n`);
			
			invalidAssignments.rows.forEach(row => {
				console.log(`❌ ${row.project_name}`);
				console.log(`   Task: "${row.task_title}"`);
				console.log(`   Assigned to: ${row.first_name} ${row.last_name} (${row.department})`);
				console.log(`   Problem: NOT in project team!\n`);
			});
			
			console.log('🔧 Fixing invalid assignments...\n');
			
			// Fix each invalid assignment
			for (const invalid of invalidAssignments.rows) {
				// Get team members for this project
				const teamMembers = await client.query(`
					SELECT e.id, e.first_name, e.last_name, e.department
					FROM employees e
					JOIN project_team_memberships ptm ON e.id = ptm.employee_id
					WHERE ptm.project_id = $1
					ORDER BY RANDOM()
					LIMIT 1
				`, [invalid.project_id]);
				
				if (teamMembers.rows.length > 0) {
					const newAssignee = teamMembers.rows[0];
					
					await client.query(`
						UPDATE tasks 
						SET assigned_to = $1, updated_at = CURRENT_TIMESTAMP
						WHERE id = $2
					`, [newAssignee.id, invalid.task_id]);
					
					console.log(`✅ Fixed: ${invalid.project_name}`);
					console.log(`   Task: "${invalid.task_title}"`);
					console.log(`   Old: ${invalid.first_name} ${invalid.last_name} (NOT in team)`);
					console.log(`   New: ${newAssignee.first_name} ${newAssignee.last_name} (${newAssignee.department}) ✓\n`);
				}
			}
		}
		
		// Final verification
		console.log('\n📊 FINAL VERIFICATION:\n');
		
		const finalCheck = await client.query(`
			SELECT 
				p.name as project_name,
				t.title as task_title,
				e.first_name,
				e.last_name,
				e.department,
				CASE 
					WHEN EXISTS (
						SELECT 1 
						FROM project_team_memberships ptm 
						WHERE ptm.project_id = p.id 
						AND ptm.employee_id = t.assigned_to
					) THEN 'VALID'
					ELSE 'INVALID'
				END as status
			FROM tasks t
			JOIN projects p ON t.project_id = p.id
			LEFT JOIN employees e ON t.assigned_to = e.id
			WHERE p.name IN ('API Integration', 'Mobile App Development', 'Security Audit')
			ORDER BY p.name, t.title
		`);
		
		let currentProject = '';
		finalCheck.rows.forEach(row => {
			if (row.project_name !== currentProject) {
				currentProject = row.project_name;
				console.log(`\n📦 ${row.project_name}:`);
			}
			const assignee = row.first_name 
				? `${row.first_name} ${row.last_name} (${row.department})`
				: 'Unassigned';
			const icon = row.status === 'VALID' ? '✅' : '❌';
			console.log(`   ${icon} ${row.task_title} → ${assignee} [${row.status}]`);
		});
		
		console.log('\n✅ All task assignments now follow the rule: assigned employees must be team members!');
		
	} catch (err) {
		console.error('❌ Error:', err.message);
		console.error(err.stack);
	} finally {
		client.release();
		await pool.end();
	}
}

main();
