#!/usr/bin/env node

const { Pool } = require('pg');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, 'server-backend/.env') });

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'project_manager',
  password: process.env.DB_PASSWORD || 'Super@123',
  port: process.env.DB_PORT || 5432,
});

// Colors for console output
const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function viewDatabase() {
  try {
    log('🗄️  Project Manager Database Viewer', 'bold');
    log('=====================================', 'bold');
    
    // Test connection
    log('\n1. Testing database connection...', 'yellow');
    const client = await pool.connect();
    log('✅ Connected to database successfully!', 'green');
    
    // Get all tables
    log('\n2. Available tables:', 'yellow');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    tablesResult.rows.forEach(row => {
      log(`   📋 ${row.table_name}`, 'cyan');
    });
    
    // View data from each table
    const tables = ['users', 'clients', 'projects', 'employees', 'time_entries'];
    
    for (const table of tables) {
      log(`\n3. 📊 Data in ${table} table:`, 'yellow');
      log('─'.repeat(50), 'blue');
      
      try {
        const result = await client.query(`SELECT * FROM ${table} ORDER BY created_at DESC LIMIT 10`);
        
        if (result.rows.length === 0) {
          log(`   No data found in ${table}`, 'red');
        } else {
          log(`   Found ${result.rows.length} records (showing latest 10):`, 'green');
          
          // Show column headers
          const columns = Object.keys(result.rows[0]);
          log(`   ${columns.join(' | ')}`, 'cyan');
          log('   ' + '─'.repeat(columns.join(' | ').length), 'blue');
          
          // Show data rows
          result.rows.forEach((row, index) => {
            const values = columns.map(col => {
              const value = row[col];
              if (value === null) return 'NULL';
              if (typeof value === 'object') return JSON.stringify(value);
              if (typeof value === 'string' && value.length > 20) {
                return value.substring(0, 17) + '...';
              }
              return String(value);
            });
            log(`   ${values.join(' | ')}`, 'reset');
          });
        }
      } catch (error) {
        log(`   ❌ Error reading ${table}: ${error.message}`, 'red');
      }
    }
    
    // Show table counts
    log('\n4. 📈 Table Statistics:', 'yellow');
    log('─'.repeat(30), 'blue');
    
    for (const table of tables) {
      try {
        const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = countResult.rows[0].count;
        log(`   ${table}: ${count} records`, 'green');
      } catch (error) {
        log(`   ${table}: Error getting count`, 'red');
      }
    }
    
    // Show recent activity
    log('\n5. 🕒 Recent Activity (Last 5 time entries):', 'yellow');
    log('─'.repeat(50), 'blue');
    
    try {
      const recentResult = await client.query(`
        SELECT 
          te.id,
          te.start_time,
          te.end_time,
          te.duration_minutes,
          te.cost,
          p.name as project_name,
          e.first_name || ' ' || e.last_name as employee_name
        FROM time_entries te
        JOIN projects p ON te.project_id = p.id
        JOIN employees e ON te.employee_id = e.id
        ORDER BY te.created_at DESC
        LIMIT 5
      `);
      
      if (recentResult.rows.length > 0) {
        recentResult.rows.forEach((row, index) => {
          log(`   ${index + 1}. ${row.employee_name} worked on "${row.project_name}"`, 'cyan');
          log(`      Duration: ${row.duration_minutes} minutes, Cost: ₹${row.cost}`, 'blue');
          log(`      Time: ${new Date(row.start_time).toLocaleString()}`, 'blue');
        });
      } else {
        log('   No time entries found', 'red');
      }
    } catch (error) {
      log(`   ❌ Error getting recent activity: ${error.message}`, 'red');
    }
    
    client.release();
    
    log('\n🎉 Database viewing complete!', 'green');
    log('\n💡 Tips:', 'bold');
    log('• Use pgAdmin for a graphical interface', 'blue');
    log('• Run this script anytime: node view-database.js', 'blue');
    log('• Check server-backend/.env for connection details', 'blue');
    
  } catch (error) {
    log(`❌ Database connection failed: ${error.message}`, 'red');
    log('\n🔧 Troubleshooting:', 'bold');
    log('1. Make sure PostgreSQL is running', 'yellow');
    log('2. Check your password: Super@123', 'yellow');
    log('3. Verify database name: project_manager', 'yellow');
    log('4. Check server-backend/.env file', 'yellow');
  } finally {
    await pool.end();
  }
}

// Run the database viewer
viewDatabase();
