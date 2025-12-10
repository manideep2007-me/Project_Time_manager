const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'project_time_manager',
  user: 'postgres',
  password: 'Super@123',
});

async function checkEmployeeTasks() {
  try {
    console.log('🔍 Checking employee tasks...\n');

    // Get Alice's employee ID
    const aliceResult = await pool.query(
      "SELECT id, first_name, last_name, email, department FROM employees WHERE email = 'alice@company.com'"
    );

    if (aliceResult.rows.length === 0) {
      console.log('❌ Alice not found in employees table');
      return;
    }

    const alice = aliceResult.rows[0];
    console.log('👤 Alice Johnson:');
    console.log(`   ID: ${alice.id}`);
    console.log(`   Email: ${alice.email}`);
    console.log(`   Department: ${alice.department}\n`);

    // Get Alice's tasks using the new query
    const tasksResult = await pool.query(
      `SELECT t.id, t.project_id, t.title, t.status, t.due_date, t.created_at, t.updated_at,
              p.name as project_name, p.status as project_status,
              json_agg(json_build_object(
                'id', e.id,
                'first_name', e.first_name,
                'last_name', e.last_name,
                'email', e.email,
                'department', e.department
              ) ORDER BY e.first_name) FILTER (WHERE e.id IS NOT NULL) as assigned_employees
       FROM tasks t
       JOIN task_assignments ta ON t.id = ta.task_id
       JOIN projects p ON t.project_id = p.id
       LEFT JOIN task_assignments all_ta ON t.id = all_ta.task_id
       LEFT JOIN employees e ON all_ta.employee_id = e.id
       WHERE ta.employee_id = $1
       GROUP BY t.id, t.project_id, t.title, t.status, t.due_date, t.created_at, t.updated_at,
                p.name, p.status
       ORDER BY t.due_date ASC NULLS LAST, t.created_at DESC
       LIMIT 10`,
      [alice.id]
    );

    console.log(`📋 Alice's Tasks (${tasksResult.rows.length} total):\n`);

    if (tasksResult.rows.length === 0) {
      console.log('   ⚠️  No tasks assigned to Alice');
      
      // Check if Alice is in task_assignments table
      const assignmentsCheck = await pool.query(
        'SELECT COUNT(*) as count FROM task_assignments WHERE employee_id = $1',
        [alice.id]
      );
      console.log(`\n   Task assignments in database: ${assignmentsCheck.rows[0].count}`);
    } else {
      tasksResult.rows.forEach((task, index) => {
        console.log(`${index + 1}. ${task.title}`);
        console.log(`   Project: ${task.project_name}`);
        console.log(`   Status: ${task.status}`);
        console.log(`   Due Date: ${task.due_date || 'No due date'}`);
        console.log(`   Assigned Team (${task.assigned_employees?.length || 0}):`);
        if (task.assigned_employees && task.assigned_employees.length > 0) {
          task.assigned_employees.forEach(emp => {
            console.log(`      - ${emp.first_name} ${emp.last_name} (${emp.department})`);
          });
        }
        console.log('');
      });
    }

    // Also check Bob
    console.log('\n' + '='.repeat(60) + '\n');
    
    const bobResult = await pool.query(
      "SELECT id, first_name, last_name, email, department FROM employees WHERE email = 'bob@company.com'"
    );

    if (bobResult.rows.length > 0) {
      const bob = bobResult.rows[0];
      console.log('👤 Bob Williams:');
      console.log(`   ID: ${bob.id}`);
      console.log(`   Email: ${bob.email}`);
      console.log(`   Department: ${bob.department}\n`);

      const bobTasksResult = await pool.query(
        `SELECT t.id, t.title, p.name as project_name, t.status
         FROM tasks t
         JOIN task_assignments ta ON t.id = ta.task_id
         JOIN projects p ON t.project_id = p.id
         WHERE ta.employee_id = $1
         GROUP BY t.id, t.title, p.name, t.status, t.created_at
         ORDER BY t.created_at DESC
         LIMIT 5`,
        [bob.id]
      );

      console.log(`📋 Bob's Tasks (${bobTasksResult.rows.length} total):\n`);
      bobTasksResult.rows.forEach((task, index) => {
        console.log(`${index + 1}. ${task.title}`);
        console.log(`   Project: ${task.project_name}`);
        console.log(`   Status: ${task.status}\n`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

checkEmployeeTasks();
