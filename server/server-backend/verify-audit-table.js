const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'project_time_manager',
  user: process.env.DB_USER || 'postgres',
  password: String(process.env.DB_PASSWORD || ''),
});

async function checkAuditTable() {
  try {
    // Check if audit_logs table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'audit_logs'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✓ audit_logs table exists');
      
      // Get table structure
      const columns = await pool.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'audit_logs'
        ORDER BY ordinal_position;
      `);
      
      console.log('\nTable structure:');
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
      });
      
      // Check row count
      const count = await pool.query('SELECT COUNT(*) FROM audit_logs');
      console.log(`\nCurrent records: ${count.rows[0].count}`);
    } else {
      console.log('✗ audit_logs table does NOT exist');
    }
    
  } catch (err) {
    console.error('Error checking audit table:', err.message);
  } finally {
    await pool.end();
  }
}

checkAuditTable();
