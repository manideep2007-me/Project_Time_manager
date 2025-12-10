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
		console.log('🔍 Checking projects for Rajesh Kumar (Manager)...\n');
		
		// Get Rajesh Kumar's employee ID
		const employee = await client.query(`
			SELECT id, first_name, last_name, email, department
			FROM employees
			WHERE first_name = 'Rajesh' AND last_name = 'Kumar'
		`);
		
		if (employee.rows.length === 0) {
			console.log('❌ Rajesh Kumar not found in employees table');
			return;
		}
		
		const rajesh = employee.rows[0];
		console.log(`👤 Found: ${rajesh.first_name} ${rajesh.last_name}`);
		console.log(`   Email: ${rajesh.email}`);
		console.log(`   Department: ${rajesh.department}`);
		console.log(`   ID: ${rajesh.id}\n`);
		
		// Get projects where Rajesh is a team member
		const projects = await client.query(`
			SELECT 
				p.id,
				p.name,
				p.status,
				ptm.role as team_role,
				ptm.added_at
			FROM projects p
			JOIN project_team_memberships ptm ON p.id = ptm.project_id
			WHERE ptm.employee_id = $1
			ORDER BY p.name
		`, [rajesh.id]);
		
		console.log(`📦 Projects where Rajesh Kumar is a team member:\n`);
		console.log(`   Total: ${projects.rows.length} projects\n`);
		
		projects.rows.forEach((project, idx) => {
			console.log(`${idx + 1}. ${project.name} [${project.status}]`);
			console.log(`   Role: ${project.team_role}`);
			console.log(`   Added: ${new Date(project.added_at).toLocaleDateString()}\n`);
		});
		
		console.log('\n✅ When Rajesh Kumar logs in as manager, he should see these ' + projects.rows.length + ' projects!');
		
	} catch (err) {
		console.error('❌ Error:', err.message);
		console.error(err.stack);
	} finally {
		client.release();
		await pool.end();
	}
}

main();
