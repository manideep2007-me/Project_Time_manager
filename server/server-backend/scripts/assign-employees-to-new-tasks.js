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
		console.log('👥 Assigning employees to newly created tasks...\n');
		
		// Get all employees
		const employeesResult = await client.query(`
			SELECT id, first_name, last_name, department 
			FROM employees 
			ORDER BY employee_id
		`);
		
		const employees = employeesResult.rows;
		console.log(`Found ${employees.length} employees:\n`);
		employees.forEach(emp => {
			console.log(`  • ${emp.first_name} ${emp.last_name} (${emp.department})`);
		});
		
		// Get tasks for the 3 projects we just added tasks to
		const tasksResult = await client.query(`
			SELECT t.id, t.title, p.name as project_name
			FROM tasks t
			JOIN projects p ON t.project_id = p.id
			WHERE p.name IN ('API Integration', 'Mobile App Development', 'Security Audit')
			AND t.assigned_to IS NULL
			ORDER BY p.name, t.created_at
		`);
		
		console.log(`\n\n🔄 Assigning ${tasksResult.rows.length} tasks...\n`);
		
		// Assignment strategy based on project type
		const assignments = {
			'API Integration': [
				{ title: 'Design API Architecture', employee: employees.find(e => e.first_name === 'Alice') }, // Engineering
				{ title: 'Implement Authentication', employee: employees.find(e => e.first_name === 'Bob') }, // Engineering
				{ title: 'API Documentation & Testing', employee: employees.find(e => e.first_name === 'Charlie') }, // QA
			],
			'Mobile App Development': [
				{ title: 'Setup Development Environment', employee: employees.find(e => e.first_name === 'Ethan') }, // DevOps
				{ title: 'Design UI/UX Mockups', employee: employees.find(e => e.first_name === 'Diana') }, // Design
				{ title: 'Implement Core Features', employee: employees.find(e => e.first_name === 'Alice') }, // Engineering
			],
			'Security Audit': [
				{ title: 'Vulnerability Assessment', employee: employees.find(e => e.first_name === 'Bob') }, // Engineering
				{ title: 'Penetration Testing', employee: employees.find(e => e.first_name === 'Charlie') }, // QA
				{ title: 'Security Report & Recommendations', employee: employees.find(e => e.first_name === 'Rajesh') }, // Manager
			],
		};
		
		for (const task of tasksResult.rows) {
			const projectAssignments = assignments[task.project_name];
			const assignment = projectAssignments?.find(a => a.title === task.title);
			
			if (assignment && assignment.employee) {
				await client.query(`
					UPDATE tasks 
					SET assigned_to = $1, updated_at = CURRENT_TIMESTAMP
					WHERE id = $2
				`, [assignment.employee.id, task.id]);
				
				console.log(`✅ ${task.project_name}`);
				console.log(`   "${task.title}" → ${assignment.employee.first_name} ${assignment.employee.last_name} (${assignment.employee.department})`);
			}
		}
		
		// Verify assignments
		const verifyResult = await client.query(`
			SELECT 
				p.name as project_name,
				t.title as task_title,
				e.first_name,
				e.last_name,
				e.department
			FROM tasks t
			JOIN projects p ON t.project_id = p.id
			LEFT JOIN employees e ON t.assigned_to = e.id
			WHERE p.name IN ('API Integration', 'Mobile App Development', 'Security Audit')
			ORDER BY p.name, t.created_at
		`);
		
		console.log('\n\n📋 VERIFICATION - All Tasks with Assignments:\n');
		let currentProject = '';
		verifyResult.rows.forEach(row => {
			if (row.project_name !== currentProject) {
				currentProject = row.project_name;
				console.log(`\n📦 ${row.project_name}:`);
			}
			const assignee = row.first_name 
				? `${row.first_name} ${row.last_name} (${row.department})`
				: 'Unassigned';
			console.log(`   ✓ ${row.task_title} → ${assignee}`);
		});
		
		console.log('\n✅ All tasks assigned successfully!');
		
	} catch (err) {
		console.error('❌ Error:', err.message);
	} finally {
		client.release();
		await pool.end();
	}
}

main();
