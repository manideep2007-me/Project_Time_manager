const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

async function seed() {
  console.log('⚠️  WARNING: This script will DELETE ALL EXISTING DATA!');
  console.log('   Use safe-seed.js for non-destructive seeding.');
  console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...');
  
  // Wait 5 seconds to give user time to cancel
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'project_time_manager',
  });

  try {
    console.log('Checking for existing data...');
    
    // Check if data already exists
    const existingUsers = await pool.query("SELECT COUNT(*) as count FROM users");
    const existingClients = await pool.query("SELECT COUNT(*) as count FROM clients");
    const existingProjects = await pool.query("SELECT COUNT(*) as count FROM projects");
    
    if (existingUsers.rows[0].count > 0 || existingClients.rows[0].count > 0 || existingProjects.rows[0].count > 0) {
      console.log('⚠️  WARNING: Data already exists in the database!');
      console.log(`   Users: ${existingUsers.rows[0].count}`);
      console.log(`   Clients: ${existingClients.rows[0].count}`);
      console.log(`   Projects: ${existingProjects.rows[0].count}`);
      console.log('');
      console.log('❌ SEED SCRIPT ABORTED to prevent data loss!');
      console.log('   Use restore-all-projects.js to restore sample data instead.');
      console.log('   Or manually clear data if you really want to reseed.');
      process.exit(0);
    }
    
    console.log('✅ No existing data found. Proceeding with seeding...');

    // Hash the password 'admin123' using bcrypt
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const user = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ('admin@company.com', $1, 'Admin', 'User', 'admin')
       RETURNING id`,
      [hashedPassword]
    );
    const managerId = user.rows[0].id;

    const client = await pool.query(`INSERT INTO clients (name, email) VALUES ('Innovate Corp', 'client@innovate.com') RETURNING id`);
    const clientId = client.rows[0].id;

    const p1 = await pool.query(
      `INSERT INTO projects (client_id, name, description, status, start_date, end_date, budget)
       VALUES ($1, 'Phoenix Platform Relaunch', 'Relaunch project', 'active', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '60 days', 1500000)
       RETURNING id`,
      [clientId]
    );

    const e1 = await pool.query(
      `INSERT INTO employees (employee_id, first_name, last_name, salary_type, salary_amount, hourly_rate)
       VALUES ('EMP001', 'Alice', 'Johnson', 'monthly', 150000, 800)
       RETURNING id`
    );
    const e2 = await pool.query(
      `INSERT INTO employees (employee_id, first_name, last_name, salary_type, salary_amount, hourly_rate)
       VALUES ('EMP002', 'Bob', 'Williams', 'monthly', 200000, 1100)
       RETURNING id`
    );

    const projectId = p1.rows[0].id;
    const emp1 = e1.rows[0].id;
    const emp2 = e2.rows[0].id;

    await pool.query(
      `INSERT INTO time_entries (project_id, employee_id, manager_id, start_time, end_time, duration_minutes, cost, description)
       VALUES ($1, $2, $3, NOW() - INTERVAL '5 hours', NOW() - INTERVAL '3 hours', 120, 1600, 'Feature work'),
              ($1, $4, $3, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hours', 60, 1100, 'Bugfix')`,
      [projectId, emp1, managerId, emp2]
    );

    // Add some sample tasks
    console.log('Adding sample tasks...');
    await pool.query(
      `INSERT INTO tasks (project_id, title, status, assigned_to, due_date)
       VALUES ($1, 'Setup user authentication system', 'todo', $2, CURRENT_DATE + INTERVAL '3 days'),
              ($1, 'Design responsive UI components', 'in_progress', $2, CURRENT_DATE + INTERVAL '1 day'),
              ($1, 'Implement database schema', 'done', $3, CURRENT_DATE - INTERVAL '1 day'),
              ($1, 'Write unit tests', 'todo', $3, CURRENT_DATE + INTERVAL '5 days'),
              ($1, 'API documentation', 'overdue', $2, CURRENT_DATE - INTERVAL '2 days')`,
      [projectId, emp1, emp2]
    );

    console.log('Seed complete. Login: admin@company.com / admin123');
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

seed();

