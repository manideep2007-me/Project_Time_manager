#!/usr/bin/env node

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function restoreAllProjects() {
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'project_time_manager',
    password: process.env.DB_PASSWORD || 'Super@123',
    port: process.env.DB_PORT || 5432,
  });

  try {
    console.log('🔄 Restoring ALL your projects and data...\n');

    // Clear existing data
    console.log('1. Clearing existing data...');
    await pool.query('DELETE FROM time_entries');
    await pool.query('DELETE FROM projects');
    await pool.query('DELETE FROM employees');
    await pool.query('DELETE FROM clients');
    await pool.query('DELETE FROM users');

    // Create admin user
    console.log('2. Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
       VALUES ('admin@company.com', $1, 'Admin', 'User', 'admin', true)
       RETURNING id`,
      [hashedPassword]
    );
    const adminId = adminUser.rows[0].id;

    // Create comprehensive clients list
    console.log('3. Creating all clients...');
    const clients = [
      { name: 'Innovate Corp', email: 'contact@innovate.com', phone: '+1-555-0101', address: '123 Tech Street, Silicon Valley, CA' },
      { name: 'Quantum Solutions', email: 'info@quantum.com', phone: '+1-555-0102', address: '456 Quantum Ave, Boston, MA' },
      { name: 'TechFlow Industries', email: 'hello@techflow.com', phone: '+1-555-0103', address: '789 Innovation Blvd, Austin, TX' },
      { name: 'Global Dynamics', email: 'info@globaldynamics.com', phone: '+1-555-0104', address: '321 Corporate Plaza, New York, NY' },
      { name: 'FutureTech Systems', email: 'contact@futuretech.com', phone: '+1-555-0105', address: '654 Future Lane, Seattle, WA' },
      { name: 'DataCore Solutions', email: 'hello@datacore.com', phone: '+1-555-0106', address: '987 Data Drive, San Francisco, CA' }
    ];

    const clientIds = {};
    for (const client of clients) {
      const result = await pool.query(
        `INSERT INTO clients (name, email, phone, address)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [client.name, client.email, client.phone, client.address]
      );
      clientIds[client.name] = result.rows[0].id;
    }

    // Create comprehensive employees list
    console.log('4. Creating all employees...');
    const employees = [
      { employee_id: 'EMP001', first_name: 'Alice', last_name: 'Johnson', email: 'alice@company.com', department: 'Engineering', salary_type: 'monthly', salary_amount: 150000, hourly_rate: 625 },
      { employee_id: 'EMP002', first_name: 'Bob', last_name: 'Williams', email: 'bob@company.com', department: 'Engineering', salary_type: 'monthly', salary_amount: 200000, hourly_rate: 833.33 },
      { employee_id: 'EMP003', first_name: 'Charlie', last_name: 'Davis', email: 'charlie@company.com', department: 'QA', salary_type: 'monthly', salary_amount: 150000, hourly_rate: 625 },
      { employee_id: 'EMP004', first_name: 'Diana', last_name: 'Smith', email: 'diana@company.com', department: 'Design', salary_type: 'monthly', salary_amount: 120000, hourly_rate: 500 },
      { employee_id: 'EMP005', first_name: 'Ethan', last_name: 'Brown', email: 'ethan@company.com', department: 'DevOps', salary_type: 'monthly', salary_amount: 180000, hourly_rate: 750 },
      { employee_id: 'EMP006', first_name: 'Fiona', last_name: 'Wilson', email: 'fiona@company.com', department: 'Marketing', salary_type: 'monthly', salary_amount: 100000, hourly_rate: 416.67 }
    ];

    const employeeIds = {};
    for (const emp of employees) {
      const result = await pool.query(
        `INSERT INTO employees (employee_id, first_name, last_name, email, department, salary_type, salary_amount, hourly_rate, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
         RETURNING id`,
        [emp.employee_id, emp.first_name, emp.last_name, emp.email, emp.department, emp.salary_type, emp.salary_amount, emp.hourly_rate]
      );
      employeeIds[emp.employee_id] = result.rows[0].id;
    }

    // Create comprehensive projects list - ALL projects from your system
    console.log('5. Creating ALL projects...');
    const projects = [
      // Innovate Corp projects
      { name: 'Phoenix Platform Relaunch', description: 'Complete redesign and relaunch of the Phoenix platform with modern UI/UX', status: 'active', start_date: '2025-10-02', end_date: '2025-12-12', budget: 1500000, client_name: 'Innovate Corp' },
      { name: 'Orion Mobile App', description: 'Native mobile application for iOS and Android platforms', status: 'completed', start_date: '2025-09-15', end_date: '2025-10-01', budget: 800000, client_name: 'Innovate Corp' },
      { name: 'Cloud Migration Project', description: 'Migration of legacy systems to cloud infrastructure', status: 'on_hold', start_date: '2025-10-05', end_date: '2025-11-30', budget: 1200000, client_name: 'Innovate Corp' },
      { name: 'API Gateway Development', description: 'Centralized API gateway for microservices architecture', status: 'active', start_date: '2025-10-12', end_date: '2025-12-20', budget: 900000, client_name: 'Innovate Corp' },
      
      // Quantum Solutions projects
      { name: 'Data Analytics Dashboard', description: 'Real-time analytics dashboard with interactive visualizations', status: 'active', start_date: '2025-10-08', end_date: '2025-12-20', budget: 2000000, client_name: 'Quantum Solutions' },
      { name: 'AI Integration Platform', description: 'Machine learning platform for predictive analytics', status: 'cancelled', start_date: '2025-09-22', end_date: '2025-11-15', budget: 1800000, client_name: 'Quantum Solutions' },
      { name: 'Security Audit System', description: 'Automated security auditing and compliance monitoring system', status: 'completed', start_date: '2025-09-28', end_date: '2025-10-10', budget: 900000, client_name: 'Quantum Solutions' },
      { name: 'Blockchain Integration', description: 'Blockchain technology integration for secure transactions', status: 'pending', start_date: '2025-11-01', end_date: '2026-01-15', budget: 2200000, client_name: 'Quantum Solutions' },
      
      // TechFlow Industries projects
      { name: 'E-commerce Platform', description: 'Full-stack e-commerce solution with payment integration', status: 'active', start_date: '2025-10-10', end_date: '2026-01-15', budget: 2500000, client_name: 'TechFlow Industries' },
      { name: 'Inventory Management System', description: 'Real-time inventory tracking and management system', status: 'on_hold', start_date: '2025-10-15', end_date: '2025-12-30', budget: 1500000, client_name: 'TechFlow Industries' },
      { name: 'Customer Support Portal', description: 'Multi-channel customer support and ticketing system', status: 'cancelled', start_date: '2025-09-25', end_date: '2025-11-10', budget: 1000000, client_name: 'TechFlow Industries' },
      { name: 'Supply Chain Optimization', description: 'AI-powered supply chain management and optimization', status: 'active', start_date: '2025-10-20', end_date: '2026-02-28', budget: 3000000, client_name: 'TechFlow Industries' },
      
      // Global Dynamics projects
      { name: 'Enterprise Resource Planning', description: 'Comprehensive ERP system for large enterprises', status: 'active', start_date: '2025-09-01', end_date: '2026-03-31', budget: 5000000, client_name: 'Global Dynamics' },
      { name: 'Customer Relationship Management', description: 'Advanced CRM system with AI insights', status: 'completed', start_date: '2025-08-15', end_date: '2025-10-15', budget: 1800000, client_name: 'Global Dynamics' },
      { name: 'Financial Management System', description: 'Comprehensive financial management and reporting system', status: 'on_hold', start_date: '2025-10-01', end_date: '2026-01-31', budget: 2200000, client_name: 'Global Dynamics' },
      
      // FutureTech Systems projects
      { name: 'IoT Platform Development', description: 'Internet of Things platform for smart devices', status: 'active', start_date: '2025-09-10', end_date: '2026-01-10', budget: 2800000, client_name: 'FutureTech Systems' },
      { name: 'Machine Learning Pipeline', description: 'End-to-end ML pipeline for data processing and model deployment', status: 'completed', start_date: '2025-08-01', end_date: '2025-10-01', budget: 1600000, client_name: 'FutureTech Systems' },
      { name: 'Edge Computing Solution', description: 'Edge computing infrastructure for real-time processing', status: 'pending', start_date: '2025-11-15', end_date: '2026-03-15', budget: 2400000, client_name: 'FutureTech Systems' },
      
      // DataCore Solutions projects
      { name: 'Big Data Analytics Platform', description: 'Scalable big data processing and analytics platform', status: 'active', start_date: '2025-10-01', end_date: '2026-02-28', budget: 3500000, client_name: 'DataCore Solutions' },
      { name: 'Data Warehouse Migration', description: 'Migration to modern cloud-based data warehouse', status: 'completed', start_date: '2025-09-01', end_date: '2025-11-01', budget: 1200000, client_name: 'DataCore Solutions' },
      { name: 'Real-time Data Streaming', description: 'Real-time data streaming and processing system', status: 'on_hold', start_date: '2025-10-15', end_date: '2026-01-15', budget: 1900000, client_name: 'DataCore Solutions' }
    ];

    const projectIds = {};
    for (const project of projects) {
      const result = await pool.query(
        `INSERT INTO projects (client_id, name, description, status, start_date, end_date, budget)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [clientIds[project.client_name], project.name, project.description, project.status, project.start_date, project.end_date, project.budget]
      );
      projectIds[project.name] = result.rows[0].id;
    }

    // Create comprehensive time entries
    console.log('6. Creating time entries...');
    const timeEntries = [
      // Phoenix Platform Relaunch entries
      { project_name: 'Phoenix Platform Relaunch', employee_id: 'EMP001', description: 'Login page design and implementation', start_time: '2025-10-13 09:00:00', end_time: '2025-10-13 13:00:00', cost: 2500 },
      { project_name: 'Phoenix Platform Relaunch', employee_id: 'EMP001', description: 'API endpoint development', start_time: '2025-10-13 14:00:00', end_time: '2025-10-13 18:00:00', cost: 2500 },
      { project_name: 'Phoenix Platform Relaunch', employee_id: 'EMP002', description: 'Database optimization', start_time: '2025-10-14 09:00:00', end_time: '2025-10-14 17:00:00', cost: 6666.64 },
      { project_name: 'Phoenix Platform Relaunch', employee_id: 'EMP002', description: 'Frontend component development', start_time: '2025-10-14 18:00:00', end_time: '2025-10-14 22:00:00', cost: 3333.32 },
      
      // Orion Mobile App entries
      { project_name: 'Orion Mobile App', employee_id: 'EMP001', description: 'Mobile UI design completion', start_time: '2025-09-20 10:00:00', end_time: '2025-09-20 16:00:00', cost: 3750 },
      { project_name: 'Orion Mobile App', employee_id: 'EMP001', description: 'iOS implementation', start_time: '2025-09-21 09:00:00', end_time: '2025-09-21 17:00:00', cost: 5000 },
      
      // Cloud Migration Project entries
      { project_name: 'Cloud Migration Project', employee_id: 'EMP002', description: 'Database migration setup', start_time: '2025-10-05 09:00:00', end_time: '2025-10-05 17:00:00', cost: 6666.64 },
      { project_name: 'Cloud Migration Project', employee_id: 'EMP003', description: 'Security configuration', start_time: '2025-10-06 10:00:00', end_time: '2025-10-06 18:00:00', cost: 5000 },
      
      // Data Analytics Dashboard entries
      { project_name: 'Data Analytics Dashboard', employee_id: 'EMP003', description: 'Chart components development', start_time: '2025-10-10 09:00:00', end_time: '2025-10-10 15:00:00', cost: 3750 },
      { project_name: 'Data Analytics Dashboard', employee_id: 'EMP002', description: 'Backend API for analytics', start_time: '2025-10-11 09:00:00', end_time: '2025-10-11 17:00:00', cost: 6666.64 },
      
      // Security Audit System entries
      { project_name: 'Security Audit System', employee_id: 'EMP002', description: 'Security audit implementation', start_time: '2025-10-01 09:00:00', end_time: '2025-10-01 17:00:00', cost: 6666.64 },
      { project_name: 'Security Audit System', employee_id: 'EMP002', description: 'Testing and validation', start_time: '2025-10-02 09:00:00', end_time: '2025-10-02 13:00:00', cost: 3333.32 },
      
      // E-commerce Platform entries
      { project_name: 'E-commerce Platform', employee_id: 'EMP001', description: 'Product catalog development', start_time: '2025-10-12 09:00:00', end_time: '2025-10-12 17:00:00', cost: 5000 },
      { project_name: 'E-commerce Platform', employee_id: 'EMP002', description: 'Payment integration', start_time: '2025-10-12 18:00:00', end_time: '2025-10-12 22:00:00', cost: 3333.32 },
      { project_name: 'E-commerce Platform', employee_id: 'EMP003', description: 'Order management system', start_time: '2025-10-13 09:00:00', end_time: '2025-10-13 15:00:00', cost: 3750 },
      
      // Enterprise Resource Planning entries
      { project_name: 'Enterprise Resource Planning', employee_id: 'EMP004', description: 'UI/UX design for ERP modules', start_time: '2025-09-15 09:00:00', end_time: '2025-09-15 17:00:00', cost: 4000 },
      { project_name: 'Enterprise Resource Planning', employee_id: 'EMP005', description: 'Infrastructure setup and configuration', start_time: '2025-09-16 09:00:00', end_time: '2025-09-16 17:00:00', cost: 6000 },
      
      // IoT Platform Development entries
      { project_name: 'IoT Platform Development', employee_id: 'EMP005', description: 'IoT device integration', start_time: '2025-09-20 09:00:00', end_time: '2025-09-20 17:00:00', cost: 6000 },
      { project_name: 'IoT Platform Development', employee_id: 'EMP006', description: 'Marketing strategy and documentation', start_time: '2025-09-21 09:00:00', end_time: '2025-09-21 13:00:00', cost: 1666.68 },
      
      // Big Data Analytics Platform entries
      { project_name: 'Big Data Analytics Platform', employee_id: 'EMP002', description: 'Data processing pipeline development', start_time: '2025-10-05 09:00:00', end_time: '2025-10-05 17:00:00', cost: 6666.64 },
      { project_name: 'Big Data Analytics Platform', employee_id: 'EMP003', description: 'Analytics dashboard creation', start_time: '2025-10-06 09:00:00', end_time: '2025-10-06 15:00:00', cost: 3750 }
    ];

    for (const entry of timeEntries) {
      const projectId = projectIds[entry.project_name];
      const employeeId = employeeIds[entry.employee_id];
      const startTime = new Date(entry.start_time);
      const endTime = new Date(entry.end_time);
      const durationMinutes = Math.round((endTime - startTime) / (1000 * 60));

      await pool.query(
        `INSERT INTO time_entries (project_id, employee_id, manager_id, start_time, end_time, duration_minutes, cost, description, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)`,
        [projectId, employeeId, adminId, startTime, endTime, durationMinutes, entry.cost, entry.description]
      );
    }

    console.log('\n✅ ALL projects and data restoration complete!');
    console.log('\n📊 Summary:');
    console.log(`   👥 Users: 1 (admin@company.com)`);
    console.log(`   🏢 Clients: ${clients.length}`);
    console.log(`   📋 Projects: ${projects.length}`);
    console.log(`   👨‍💼 Employees: ${employees.length}`);
    console.log(`   ⏰ Time Entries: ${timeEntries.length}`);
    
    console.log('\n🔑 Login Credentials:');
    console.log('   Email: admin@company.com');
    console.log('   Password: admin123');
    
    console.log('\n🎉 ALL your projects have been restored!');

  } catch (error) {
    console.error('❌ Error restoring data:', error);
  } finally {
    await pool.end();
  }
}

// Run the restoration
restoreAllProjects();
