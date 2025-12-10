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
		console.log('🔍 Finding projects with less than 3 tasks...\n');
		
		// Get projects with less than 3 tasks
		const projectsResult = await client.query(`
			SELECT 
				p.id,
				p.name,
				p.status,
				COUNT(t.id) as task_count
			FROM projects p
			LEFT JOIN tasks t ON p.id = t.project_id
			GROUP BY p.id, p.name, p.status
			HAVING COUNT(t.id) < 3
			ORDER BY p.name
		`);
		
		console.log(`Found ${projectsResult.rows.length} projects needing tasks:\n`);
		
		for (const project of projectsResult.rows) {
			const tasksNeeded = 3 - parseInt(project.task_count);
			console.log(`📝 Adding ${tasksNeeded} tasks to: ${project.name}`);
			
			const taskTemplates = {
				'API Integration': [
					{ title: 'Design API Architecture' },
					{ title: 'Implement Authentication' },
					{ title: 'API Documentation & Testing' },
				],
				'Mobile App Development': [
					{ title: 'Setup Development Environment' },
					{ title: 'Design UI/UX Mockups' },
					{ title: 'Implement Core Features' },
				],
				'Security Audit': [
					{ title: 'Vulnerability Assessment' },
					{ title: 'Penetration Testing' },
					{ title: 'Security Report & Recommendations' },
				],
			};
			
			const tasks = taskTemplates[project.name] || [
				{ title: 'Planning & Requirements' },
				{ title: 'Development & Implementation' },
				{ title: 'Testing & Quality Assurance' },
			];
			
			for (let i = 0; i < tasksNeeded; i++) {
				const task = tasks[i];
				await client.query(`
					INSERT INTO tasks (project_id, title, status, created_at, updated_at)
					VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
				`, [project.id, task.title, 'todo']);
				
				console.log(`   ✅ Added: ${task.title}`);
			}
			console.log('');
		}
		
		// Verify the update
		const verifyResult = await client.query(`
			SELECT 
				p.name,
				COUNT(t.id) as task_count
			FROM projects p
			LEFT JOIN tasks t ON p.id = t.project_id
			GROUP BY p.id, p.name
			HAVING COUNT(t.id) < 3
		`);
		
		console.log('\n📈 Verification:');
		console.log(`─────────────────────────────────────────`);
		if (verifyResult.rows.length === 0) {
			console.log('🎉 All projects now have at least 3 tasks!');
		} else {
			console.log(`⚠️  Still ${verifyResult.rows.length} project(s) with < 3 tasks`);
		}
		
	} catch (err) {
		console.error('❌ Error:', err.message);
	} finally {
		client.release();
		await pool.end();
	}
}

main();
