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
		console.log('🔍 Checking task count for each project...\n');
		
		// Get all projects with their task counts
		const result = await client.query(`
			SELECT 
				p.id,
				p.name,
				p.status,
				COUNT(t.id) as task_count
			FROM projects p
			LEFT JOIN tasks t ON p.id = t.project_id
			GROUP BY p.id, p.name, p.status
			ORDER BY task_count ASC, p.name
		`);
		
		console.log(`📊 Found ${result.rows.length} projects:\n`);
		
		let projectsWithLessThan3Tasks = 0;
		let projectsWith3OrMoreTasks = 0;
		
		result.rows.forEach(project => {
			const taskCount = parseInt(project.task_count);
			const icon = taskCount >= 3 ? '✅' : '⚠️';
			const status = taskCount >= 3 ? 'OK' : 'NEEDS MORE TASKS';
			
			console.log(`${icon} ${project.name}`);
			console.log(`   Status: ${project.status} | Tasks: ${taskCount} | ${status}`);
			console.log('');
			
			if (taskCount < 3) {
				projectsWithLessThan3Tasks++;
			} else {
				projectsWith3OrMoreTasks++;
			}
		});
		
		console.log('\n📈 Summary:');
		console.log(`─────────────────────────────────────────`);
		console.log(`✅ Projects with 3+ tasks: ${projectsWith3OrMoreTasks}`);
		console.log(`⚠️  Projects with < 3 tasks: ${projectsWithLessThan3Tasks}`);
		console.log(`📦 Total projects: ${result.rows.length}`);
		
		if (projectsWithLessThan3Tasks > 0) {
			console.log(`\n⚠️  ${projectsWithLessThan3Tasks} project(s) need more tasks!`);
		} else {
			console.log('\n🎉 All projects have at least 3 tasks!');
		}
		
	} catch (err) {
		console.error('❌ Error:', err.message);
	} finally {
		client.release();
		await pool.end();
	}
}

main();
