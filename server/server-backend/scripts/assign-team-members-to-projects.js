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

// Shuffle array helper
function shuffle(array) {
	const arr = [...array];
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
}

async function main() {
	const client = await pool.connect();
	try {
		console.log('👥 Assigning team members to all projects...\n');
		
		// Get all employees
		const employeesResult = await client.query(`
			SELECT id, first_name, last_name, department 
			FROM employees 
			ORDER BY employee_id
		`);
		const employees = employeesResult.rows;
		console.log(`Found ${employees.length} employees\n`);
		
		// Get all projects
		const projectsResult = await client.query(`
			SELECT id, name, status 
			FROM projects 
			ORDER BY name
		`);
		const projects = projectsResult.rows;
		console.log(`Found ${projects.length} projects\n`);
		
		// Clear existing team memberships first
		await client.query('DELETE FROM project_team_memberships');
		console.log('🗑️  Cleared existing team memberships\n');
		
		console.log('🔄 Assigning team members...\n');
		
		let totalAssignments = 0;
		
		for (const project of projects) {
			// Randomly assign 3-4 employees per project
			const teamSize = Math.random() > 0.5 ? 4 : 3;
			const shuffledEmployees = shuffle(employees);
			const teamMembers = shuffledEmployees.slice(0, teamSize);
			
			console.log(`📦 ${project.name} [${project.status}]`);
			console.log(`   Team size: ${teamSize}`);
			
			for (const member of teamMembers) {
				await client.query(`
					INSERT INTO project_team_memberships (project_id, employee_id, role, added_at)
					VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
				`, [project.id, member.id, 'Team Member']);
				
				console.log(`   ✅ ${member.first_name} ${member.last_name} (${member.department})`);
				totalAssignments++;
			}
			console.log('');
		}
		
		// Verification
		const verifyResult = await client.query(`
			SELECT 
				p.name as project_name,
				COUNT(ptm.employee_id) as team_count
			FROM projects p
			LEFT JOIN project_team_memberships ptm ON p.id = ptm.project_id
			GROUP BY p.id, p.name
			ORDER BY p.name
		`);
		
		console.log('\n📊 VERIFICATION - Team Members per Project:\n');
		console.log('═'.repeat(60));
		
		let projectsWithLessThan3 = 0;
		let projectsWith3Plus = 0;
		
		verifyResult.rows.forEach(row => {
			const count = parseInt(row.team_count);
			const icon = count >= 3 ? '✅' : '⚠️';
			console.log(`${icon} ${row.project_name}: ${count} members`);
			
			if (count >= 3) {
				projectsWith3Plus++;
			} else {
				projectsWithLessThan3++;
			}
		});
		
		console.log('═'.repeat(60));
		console.log(`\n📈 Summary:`);
		console.log(`   Total Projects: ${verifyResult.rows.length}`);
		console.log(`   Total Assignments: ${totalAssignments}`);
		console.log(`   Projects with 3+ members: ${projectsWith3Plus}`);
		console.log(`   Projects with < 3 members: ${projectsWithLessThan3}`);
		console.log(`   Average team size: ${(totalAssignments / verifyResult.rows.length).toFixed(1)}`);
		
		if (projectsWithLessThan3 === 0) {
			console.log('\n🎉 All projects have at least 3 team members!');
		}
		
	} catch (err) {
		console.error('❌ Error:', err.message);
		console.error(err.stack);
	} finally {
		client.release();
		await pool.end();
	}
}

main();
