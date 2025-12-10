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
		console.log('🔍 Verifying project-task mappings...\n');
		
		const result = await client.query(`
			SELECT 
				p.name as project_name,
				p.status as project_status,
				t.title as task_title,
				t.status as task_status,
				t.created_at
			FROM projects p
			INNER JOIN tasks t ON p.id = t.project_id
			WHERE p.name IN ('API Integration', 'Mobile App Development', 'Security Audit')
			ORDER BY p.name, t.created_at
		`);
		
		let currentProject = '';
		result.rows.forEach(row => {
			if (row.project_name !== currentProject) {
				currentProject = row.project_name;
				console.log(`\n📦 ${row.project_name} (${row.project_status})`);
				console.log('   Tasks:');
			}
			console.log(`   ✅ ${row.task_title} [${row.task_status}]`);
		});
		
		console.log(`\n\n📊 Total tasks mapped: ${result.rows.length}`);
		
	} catch (err) {
		console.error('❌ Error:', err.message);
	} finally {
		client.release();
		await pool.end();
	}
}

main();
