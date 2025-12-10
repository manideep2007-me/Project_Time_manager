#!/usr/bin/env node

const { Pool } = require('pg');
const readline = require('readline');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'project_time_manager',
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

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function runQuery(query) {
  try {
    const client = await pool.connect();
    const result = await client.query(query);
    client.release();
    
    if (result.rows.length === 0) {
      log('No results found.', 'yellow');
      return;
    }
    
    // Show column headers
    const columns = Object.keys(result.rows[0]);
    log(`\n${columns.join(' | ')}`, 'cyan');
    log('─'.repeat(columns.join(' | ').length), 'blue');
    
    // Show data rows
    result.rows.forEach((row, index) => {
      const values = columns.map(col => {
        const value = row[col];
        if (value === null) return 'NULL';
        if (typeof value === 'object') return JSON.stringify(value);
        if (typeof value === 'string' && value.length > 30) {
          return value.substring(0, 27) + '...';
        }
        return String(value);
      });
      log(`${values.join(' | ')}`, 'reset');
    });
    
    log(`\n✅ Query executed successfully. ${result.rows.length} rows returned.`, 'green');
    
  } catch (error) {
    log(`❌ Query failed: ${error.message}`, 'red');
  }
}

async function showMenu() {
  log('\n🗄️  Database Query Tool', 'bold');
  log('======================', 'bold');
  log('\nChoose an option:', 'yellow');
  log('1. View all users', 'blue');
  log('2. View all projects', 'blue');
  log('3. View all employees', 'blue');
  log('4. View all time entries', 'blue');
  log('5. View all clients', 'blue');
  log('6. Custom SQL query', 'blue');
  log('7. Show table schemas', 'blue');
  log('8. Exit', 'blue');
  
  rl.question('\nEnter your choice (1-8): ', async (choice) => {
    switch (choice) {
      case '1':
        await runQuery('SELECT id, email, first_name, last_name, role, is_active, created_at FROM users ORDER BY created_at DESC');
        showMenu();
        break;
        
      case '2':
        await runQuery(`
          SELECT 
            p.id, p.name, p.description, p.status, p.start_date, p.end_date, p.budget,
            c.name as client_name
          FROM projects p
          JOIN clients c ON p.client_id = c.id
          ORDER BY p.created_at DESC
        `);
        showMenu();
        break;
        
      case '3':
        await runQuery(`
          SELECT 
            id, employee_id, first_name, last_name, email, department, 
            salary_type, salary_amount, hourly_rate, is_active, created_at
          FROM employees 
          ORDER BY created_at DESC
        `);
        showMenu();
        break;
        
      case '4':
        await runQuery(`
          SELECT 
            te.id, te.start_time, te.end_time, te.duration_minutes, te.cost, te.description,
            p.name as project_name,
            e.first_name || ' ' || e.last_name as employee_name
          FROM time_entries te
          JOIN projects p ON te.project_id = p.id
          JOIN employees e ON te.employee_id = e.id
          ORDER BY te.created_at DESC
        `);
        showMenu();
        break;
        
      case '5':
        await runQuery('SELECT id, name, email, phone, address, created_at FROM clients ORDER BY created_at DESC');
        showMenu();
        break;
        
      case '6':
        rl.question('\nEnter your SQL query: ', async (query) => {
          if (query.trim().toLowerCase().startsWith('select')) {
            await runQuery(query);
          } else {
            log('❌ Only SELECT queries are allowed for safety.', 'red');
          }
          showMenu();
        });
        break;
        
      case '7':
        await runQuery(`
          SELECT 
            table_name,
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          ORDER BY table_name, ordinal_position
        `);
        showMenu();
        break;
        
      case '8':
        log('\n👋 Goodbye!', 'green');
        rl.close();
        process.exit(0);
        break;
        
      default:
        log('❌ Invalid choice. Please try again.', 'red');
        showMenu();
        break;
    }
  });
}

async function main() {
  try {
    // Test connection
    const client = await pool.connect();
    log('✅ Connected to database successfully!', 'green');
    client.release();
    
    showMenu();
    
  } catch (error) {
    log(`❌ Database connection failed: ${error.message}`, 'red');
    log('\n🔧 Troubleshooting:', 'bold');
    log('1. Make sure PostgreSQL is running', 'yellow');
    log('2. Check your password: Super@123', 'yellow');
    log('3. Verify database name: project_time_manager', 'yellow');
    process.exit(1);
  }
}

// Handle Ctrl+C
process.on('SIGINT', () => {
  log('\n\n👋 Goodbye!', 'green');
  rl.close();
  process.exit(0);
});

// Run the application
main();
