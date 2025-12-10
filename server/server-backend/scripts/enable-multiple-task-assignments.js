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
		console.log('🔧 Adding support for multiple employees per task...\n');
		
		// Step 1: Create task_assignments junction table
		console.log('📋 Creating task_assignments table...');
		await client.query(`
			CREATE TABLE IF NOT EXISTS task_assignments (
				id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
				task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
				employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
				assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
				UNIQUE(task_id, employee_id)
			);
			
			CREATE INDEX IF NOT EXISTS idx_task_assignments_task_id ON task_assignments(task_id);
			CREATE INDEX IF NOT EXISTS idx_task_assignments_employee_id ON task_assignments(employee_id);
		`);
		console.log('✅ Created task_assignments table\n');
		
		// Step 2: Migrate existing assignments from tasks.assigned_to to task_assignments
		console.log('🔄 Migrating existing task assignments...');
		const existingAssignments = await client.query(`
			SELECT id, assigned_to 
			FROM tasks 
			WHERE assigned_to IS NOT NULL
		`);
		
		console.log(`Found ${existingAssignments.rows.length} tasks with assignments\n`);
		
		let migrated = 0;
		for (const task of existingAssignments.rows) {
			// Check if already migrated
			const existing = await client.query(`
				SELECT id FROM task_assignments 
				WHERE task_id = $1 AND employee_id = $2
			`, [task.id, task.assigned_to]);
			
			if (existing.rows.length === 0) {
				await client.query(`
					INSERT INTO task_assignments (task_id, employee_id)
					VALUES ($1, $2)
				`, [task.id, task.assigned_to]);
				migrated++;
			}
		}
		
		console.log(`✅ Migrated ${migrated} task assignments to new table\n`);
		
		// Step 3: Verify migration
		const verifyCount = await client.query(`
			SELECT COUNT(*) as count FROM task_assignments
		`);
		console.log(`📊 Total assignments in task_assignments table: ${verifyCount.rows[0].count}\n`);
		
		// Step 4: Show example of tasks with multiple assignments
		console.log('📝 Now you can assign multiple employees to a single task!\n');
		console.log('Example usage:');
		console.log('  INSERT INTO task_assignments (task_id, employee_id)');
		console.log('  VALUES (\'task-uuid\', \'employee1-uuid\'), (\'task-uuid\', \'employee2-uuid\');\n');
		
		// Step 5: Verify the 3 new projects
		const verification = await client.query(`
			SELECT 
				p.name as project_name,
				t.title as task_title,
				array_agg(e.first_name || ' ' || e.last_name) as assigned_employees
			FROM tasks t
			JOIN projects p ON t.project_id = p.id
			LEFT JOIN task_assignments ta ON t.id = ta.task_id
			LEFT JOIN employees e ON ta.employee_id = e.id
			WHERE p.name IN ('API Integration', 'Mobile App Development', 'Security Audit')
			GROUP BY p.name, t.title, t.created_at
			ORDER BY p.name, t.created_at
		`);
		
		console.log('📦 Current assignments for new projects:\n');
		let currentProject = '';
		verification.rows.forEach(row => {
			if (row.project_name !== currentProject) {
				currentProject = row.project_name;
				console.log(`\n${row.project_name}:`);
			}
			const employees = row.assigned_employees[0] ? row.assigned_employees.join(', ') : 'None';
			console.log(`  • ${row.task_title}`);
			console.log(`    👥 ${employees}`);
		});
		
		console.log('\n\n✅ Migration complete! You can now assign multiple employees to any task.');
		console.log('💡 Note: The old assigned_to column in tasks table is kept for backward compatibility.');
		
	} catch (err) {
		console.error('❌ Error:', err.message);
		console.error(err.stack);
	} finally {
		client.release();
		await pool.end();
	}
}

main();
