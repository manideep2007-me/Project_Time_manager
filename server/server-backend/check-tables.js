const { Pool } = require('pg');

const registry = new Pool({ 
  host: 'localhost', 
  port: 5432, 
  user: 'postgres', 
  password: '123456', 
  database: 'project_registry' 
});

const timeManager = new Pool({ 
  host: 'localhost', 
  port: 5432, 
  user: 'postgres', 
  password: '123456', 
  database: 'project_time_manager' 
});

async function checkTables() {
  try {
    console.log('\n=== Checking project_registry database ===');
    const r1 = await registry.query(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = 'public' 
       AND table_name IN ('users', 'employees_registry', 'organizations_registry')
       ORDER BY table_name`
    );
    console.log('Tables:', r1.rows.map(r => r.table_name));
    
    console.log('\n=== Checking project_time_manager database ===');
    const r2 = await timeManager.query(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = 'public' 
       AND table_name IN ('users', 'employees_registry', 'organizations_registry')
       ORDER BY table_name`
    );
    console.log('Tables:', r2.rows.map(r => r.table_name));
    
    console.log('\n=== Checking for admin@company.com ===');
    try {
      const adminCheck = await timeManager.query('SELECT email_id, role FROM users WHERE email_id = $1', ['admin@company.com']);
      if (adminCheck.rows.length > 0) {
        console.log('✅ Found admin@company.com in project_time_manager.users:', adminCheck.rows[0]);
      } else {
        console.log('❌ admin@company.com NOT found in project_time_manager.users');
      }
    } catch (err) {
      console.log('❌ Error checking users table:', err.message);
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await registry.end();
    await timeManager.end();
  }
}

checkTables();
