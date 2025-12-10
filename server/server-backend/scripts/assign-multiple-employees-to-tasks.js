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
		console.log('👥 Assigning multiple employees to tasks...\n');
		
		// Get team members for the 3 new projects
		const projectTeams = await client.query(`
			SELECT 
				p.id as project_id,
				p.name as project_name,
				t.id as task_id,
				t.title as task_title,
				array_agg(ptm.employee_id) as team_member_ids,
				array_agg(e.first_name || ' ' || e.last_name) as team_members
			FROM projects p
			JOIN tasks t ON t.project_id = p.id
			JOIN project_team_memberships ptm ON ptm.project_id = p.id
			JOIN employees e ON e.id = ptm.employee_id
			WHERE p.name IN ('API Integration', 'Mobile App Development', 'Security Audit')
			GROUP BY p.id, p.name, t.id, t.title
			ORDER BY p.name, t.title
		`);
		
		console.log('🔄 Adding additional team members to tasks...\n');
		
		for (const row of projectTeams.rows) {
			// Get current assignments
			const currentAssignments = await client.query(`
				SELECT employee_id FROM task_assignments WHERE task_id = $1
			`, [row.task_id]);
			
			const currentIds = currentAssignments.rows.map(a => a.employee_id);
			const availableIds = row.team_member_ids.filter(id => !currentIds.includes(id));
			
			// Assign 1-2 more team members randomly
			const additionalCount = Math.min(availableIds.length, Math.random() > 0.5 ? 2 : 1);
			
			if (additionalCount > 0) {
				const shuffled = availableIds.sort(() => Math.random() - 0.5);
				const toAssign = shuffled.slice(0, additionalCount);
				
				for (const employeeId of toAssign) {
					await client.query(`
						INSERT INTO task_assignments (task_id, employee_id)
						VALUES ($1, $2)
						ON CONFLICT (task_id, employee_id) DO NOTHING
					`, [row.task_id, employeeId]);
				}
			}
		}
		
		console.log('✅ Added additional assignments\n');
		
		// Show final assignments
		const finalAssignments = await client.query(`
			SELECT 
				p.name as project_name,
				t.title as task_title,
				COUNT(ta.employee_id) as assignee_count,
				array_agg(e.first_name || ' ' || e.last_name || ' (' || e.department || ')') as assignees
			FROM tasks t
			JOIN projects p ON t.project_id = p.id
			LEFT JOIN task_assignments ta ON t.id = ta.task_id
			LEFT JOIN employees e ON ta.employee_id = e.id
			WHERE p.name IN ('API Integration', 'Mobile App Development', 'Security Audit')
			GROUP BY p.name, t.title, t.created_at
			ORDER BY p.name, t.created_at
		`);
		
		console.log('📊 FINAL TASK ASSIGNMENTS (Multiple Employees per Task):\n');
		console.log('═'.repeat(70));
		
		let currentProject = '';
		finalAssignments.rows.forEach(row => {
			if (row.project_name !== currentProject) {
				currentProject = row.project_name;
				console.log(`\n📦 ${row.project_name}:\n`);
			}
			console.log(`   ✅ ${row.task_title}`);
			console.log(`      👥 ${row.assignee_count} assignee(s):`);
			if (row.assignees[0]) {
				row.assignees.forEach(assignee => {
					console.log(`         • ${assignee}`);
				});
			} else {
				console.log(`         • None`);
			}
			console.log('');
		});
		
		console.log('═'.repeat(70));
		console.log('\n✅ Multiple employees can now be assigned to each task!');
		
	} catch (err) {
		console.error('❌ Error:', err.message);
		console.error(err.stack);
	} finally {
		client.release();
		await pool.end();
	}
}

main();
