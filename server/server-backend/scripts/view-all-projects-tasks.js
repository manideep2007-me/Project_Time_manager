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
		console.log('📊 ALL PROJECTS AND THEIR TASKS\n');
		console.log('═'.repeat(80));
		
		// Get all projects with their tasks
		const result = await client.query(`
			SELECT 
				p.id as project_id,
				p.name as project_name,
				p.status as project_status,
				t.id as task_id,
				t.title as task_title,
				t.status as task_status
			FROM projects p
			LEFT JOIN tasks t ON p.id = t.project_id
			ORDER BY p.name, t.created_at
		`);
		
		// Group by projects
		const projects = {};
		result.rows.forEach(row => {
			if (!projects[row.project_id]) {
				projects[row.project_id] = {
					name: row.project_name,
					status: row.project_status,
					tasks: []
				};
			}
			if (row.task_id) {
				projects[row.project_id].tasks.push({
					title: row.task_title,
					status: row.task_status
				});
			}
		});
		
		// Display all projects and tasks
		let projectCount = 0;
		let totalTasks = 0;
		
		Object.values(projects).forEach(project => {
			projectCount++;
			const taskCount = project.tasks.length;
			totalTasks += taskCount;
			
			console.log(`\n${projectCount}. 📦 ${project.name} [${project.status}]`);
			console.log(`   Tasks (${taskCount}):`);
			
			if (project.tasks.length === 0) {
				console.log('   ⚠️  No tasks');
			} else {
				project.tasks.forEach((task, idx) => {
					console.log(`   ${idx + 1}. ✓ ${task.title} [${task.status}]`);
				});
			}
		});
		
		console.log('\n' + '═'.repeat(80));
		console.log(`\n📈 SUMMARY:`);
		console.log(`   Total Projects: ${projectCount}`);
		console.log(`   Total Tasks: ${totalTasks}`);
		console.log(`   Average Tasks per Project: ${(totalTasks / projectCount).toFixed(1)}`);
		
	} catch (err) {
		console.error('❌ Error:', err.message);
	} finally {
		client.release();
		await pool.end();
	}
}

main();
