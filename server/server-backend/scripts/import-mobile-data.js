#!/usr/bin/env node

// Import the current "mock" data from the mobile app as ACTUAL database rows.
// Safe to run multiple times: uses simple upserts keyed by natural keys.

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Copy of the mobile data (treated as canonical app data)
const DATA = {
  users: [
    { id: 'user1', name: 'Admin User', role: 'manager', email: 'admin@company.com', jobTitle: 'Administrator', salaryMonthly: 150000 },
    { id: 'user2', name: 'Rajesh (Manager)', role: 'manager', email: 'rajesh@company.com', jobTitle: 'Project Manager', salaryMonthly: 120000 },
    { id: 'user3', name: 'Alice Johnson', role: 'employee', email: 'alice@company.com', jobTitle: 'Senior Developer', salaryMonthly: 90000 },
    { id: 'user4', name: 'Bob Williams', role: 'employee', email: 'bob@company.com', jobTitle: 'QA Engineer', salaryMonthly: 70000 },
    { id: 'user5', name: 'Charlie Davis', role: 'employee', email: 'charlie@company.com', jobTitle: 'Frontend Developer', salaryMonthly: 80000 },
    { id: 'user6', name: 'Deepak Kumar', role: 'employee', email: 'deepak@company.com', jobTitle: 'Backend Developer', salaryMonthly: 85000 },
    { id: 'user7', name: 'Sneha Patel', role: 'employee', email: 'sneha@company.com', jobTitle: 'UI/UX Designer', salaryMonthly: 78000 },
    { id: 'user8', name: 'Arjun Reddy', role: 'employee', email: 'arjun@company.com', jobTitle: 'DevOps Engineer', salaryMonthly: 92000 },
    { id: 'user9', name: 'Kavya Sharma', role: 'employee', email: 'kavya@company.com', jobTitle: 'Data Analyst', salaryMonthly: 159000 },
  ],
  clients: [
    {
      id: 'c1',
      name: 'Tech Corp',
      email: 'contact@techcorp.com',
      phone: '+91 9876543210',
      address: 'Bengaluru, IN',
      contact_person: 'Priya Sharma',
      status: 'ACTIVE',
      projects: [
        {
          id: 'p1a',
          name: 'Phoenix Platform Relaunch',
          description: 'Core platform modernization',
          status: 'active',
          startDate: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
          endDate: new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10),
          budget: 1500000,
          allocated_hours: 1200,
          assignedEmployees: ['user3', 'user5'],
          employees: ['user3', 'user5'],
        },
        {
          id: 'p1b',
          name: 'Orion Mobile App',
          description: 'Consumer mobile application',
          status: 'in_progress',
          startDate: new Date(Date.now() - 10 * 86400000).toISOString().slice(0, 10),
          endDate: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
          budget: 900000,
          allocated_hours: 800,
          assignedEmployees: ['user3', 'user4', 'user5'],
          employees: ['user3', 'user4', 'user5'],
        }
      ],
    },
    {
      id: 'c2',
      name: 'Retail Plus',
      email: 'hello@retailplus.com',
      phone: '+91 9988776655',
      address: 'Hyderabad, IN',
      contact_person: 'Rohan Gupta',
      status: 'ACTIVE',
      projects: [
        {
          id: 'p2a',
          name: 'E-commerce Revamp',
          description: 'New storefront and checkout',
          status: 'active',
          startDate: new Date(Date.now() - 45 * 86400000).toISOString().slice(0, 10),
          endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
          budget: 1200000,
          allocated_hours: 1000,
          assignedEmployees: ['user3', 'user4'],
          employees: ['user3', 'user4'],
        }
      ],
    }
  ],
  timeEntries: [
    {
      id: 'te1', employeeId: 'user3', projectId: 'p1a',
      date: new Date().toISOString().slice(0,10), hours: 3.5, description: 'API integration',
      startTime: new Date(Date.now() - 4 * 3600000).toISOString(), endTime: new Date(Date.now() - 0.5 * 3600000).toISOString(), isActive: false,
    },
    {
      id: 'te2', employeeId: 'user5', projectId: 'p1b',
      date: new Date().toISOString().slice(0,10), hours: 2, description: 'UI polish',
      startTime: new Date(Date.now() - 3 * 3600000).toISOString(), endTime: new Date(Date.now() - 1 * 3600000).toISOString(), isActive: false,
    },
  ],
};

async function run() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'project_time_manager',
  });

  const client = await pool.connect();
  try {
    console.log('⏫ Importing mobile data into database...');
    await client.query('BEGIN');

    // Ensure admin user exists (for manager_id on time entries)
    const adminEmail = 'admin@company.com';
    const adminPassword = 'admin123';
    const adminRes = await client.query('SELECT id FROM users WHERE email=$1', [adminEmail]);
    let managerId;
    if (adminRes.rows.length === 0) {
      const hash = await bcrypt.hash(adminPassword, 10);
      const ins = await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
         VALUES ($1,$2,'Admin','User','admin', true) RETURNING id`,
        [adminEmail, hash]
      );
      managerId = ins.rows[0].id;
    } else {
      managerId = adminRes.rows[0].id;
    }

    // Upsert clients
    const clientIdMap = new Map(); // name -> id
    for (const c of DATA.clients) {
      const res = await client.query('SELECT id FROM clients WHERE LOWER(name)=LOWER($1)', [c.name]);
      let cid;
      if (res.rows.length === 0) {
        const ins = await client.query(
          `INSERT INTO clients (name, email, phone, address)
           VALUES ($1,$2,$3,$4) RETURNING id`,
          [c.name, c.email || null, c.phone || null, c.address || null]
        );
        cid = ins.rows[0].id;
      } else {
        cid = res.rows[0].id;
        await client.query(
          `UPDATE clients SET email=$2, phone=$3, address=$4 WHERE id=$1`,
          [cid, c.email || null, c.phone || null, c.address || null]
        );
      }
      clientIdMap.set(c.name, cid);

      // Upsert projects for client
      for (const p of c.projects || []) {
        const pres = await client.query('SELECT id FROM projects WHERE client_id=$1 AND LOWER(name)=LOWER($2)', [cid, p.name]);
        let pid;
        if (pres.rows.length === 0) {
          const ins = await client.query(
            `INSERT INTO projects (client_id, name, description, status, start_date, end_date, budget)
             VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
            [cid, p.name, p.description || null, (p.status || 'active'), p.startDate || null, p.endDate || null, p.budget || 0]
          );
          pid = ins.rows[0].id;
        } else {
          pid = pres.rows[0].id;
          await client.query(
            `UPDATE projects SET description=$2, status=$3, start_date=$4, end_date=$5, budget=$6 WHERE id=$1`,
            [pid, p.description || null, (p.status || 'active'), p.startDate || null, p.endDate || null, p.budget || 0]
          );
        }
      }
    }

    // Upsert employees for employee users
    const departmentByUserId = {
      user3: 'Engineering',
      user4: 'QA',
      user5: 'Frontend',
      user6: 'Backend',
      user7: 'Design',
      user8: 'DevOps',
      user9: 'Data Analytics',
    };
    const employeeIdMap = new Map(); // userId -> employees.id
    for (const u of DATA.users) {
      if (u.role !== 'employee') continue;
      const firstName = String(u.name || '').split(' ')[0] || u.name || 'Employee';
      const lastName = String(u.name || '').split(' ').slice(1).join(' ') || '';
      const department = departmentByUserId[u.id] || 'Engineering';
      const find = await client.query('SELECT id FROM employees WHERE LOWER(email)=LOWER($1)', [u.email || '']);
      let eid;
      if (find.rows.length === 0) {
        const ins = await client.query(
          `INSERT INTO employees (employee_id, first_name, last_name, email, department, salary_type, salary_amount, hourly_rate, is_active)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true) RETURNING id`,
          [
            (u.id || '').toUpperCase(),
            firstName,
            lastName,
            u.email || null,
            department,
            'monthly',
            u.salaryMonthly || 0,
            Math.round(((u.salaryMonthly || 0) / (24 * 8)) * 100) / 100,
          ]
        );
        eid = ins.rows[0].id;
      } else {
        eid = find.rows[0].id;
        await client.query(
          `UPDATE employees SET first_name=$2,last_name=$3,department=$4,salary_type='monthly',salary_amount=$5,hourly_rate=$6,is_active=true WHERE id=$1`,
          [eid, firstName, lastName, department, u.salaryMonthly || 0, Math.round(((u.salaryMonthly || 0) / (24 * 8)) * 100) / 100]
        );
      }
      employeeIdMap.set(u.id, eid);
    }

    // Map project codes to ids for time entries
    const projectIdByMobileId = new Map();
    for (const c of DATA.clients) {
      const cid = clientIdMap.get(c.name);
      for (const p of c.projects || []) {
        const res = await client.query('SELECT id FROM projects WHERE client_id=$1 AND LOWER(name)=LOWER($2)', [cid, p.name]);
        if (res.rows[0]) projectIdByMobileId.set(p.id, res.rows[0].id);
      }
    }

    // Ensure each project has at least two employees with time entries
    const allProjectIds = Array.from(projectIdByMobileId.values());
    for (const pid of allProjectIds) {
      const exists = await client.query(
        `SELECT COUNT(DISTINCT employee_id) as cnt FROM time_entries WHERE project_id=$1 AND is_active=true`,
        [pid]
      );
      const distinctCount = parseInt(exists.rows[0].cnt || '0');
      if (distinctCount < 2) {
        // Pick two employees deterministically
        const emps = await client.query(`SELECT id FROM employees WHERE is_active=true ORDER BY created_at ASC LIMIT 2`);
        if (emps.rows.length >= 2) {
          const start = new Date();
          const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
          for (const row of emps.rows.slice(0, 2)) {
            const du = Math.round((end - start) / (1000 * 60));
            await client.query(
              `INSERT INTO time_entries (project_id, employee_id, manager_id, start_time, end_time, duration_minutes, cost, description, is_active)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true)`,
              [pid, row.id, managerId, start, end, du, 0, 'Auto-assigned work']
            );
          }
        }
      }
    }

    // Insert time entries (idempotent by description+start_time+employee)
    for (const te of DATA.timeEntries) {
      const pid = projectIdByMobileId.get(te.projectId);
      const eid = employeeIdMap.get(te.employeeId);
      if (!pid || !eid) continue;
      const start = new Date(te.startTime);
      const end = new Date(te.endTime);
      const durationMinutes = Math.max(0, Math.round((end - start) / (1000 * 60)));
      const check = await client.query(
        `SELECT id FROM time_entries WHERE project_id=$1 AND employee_id=$2 AND start_time=$3 AND description=$4`,
        [pid, eid, start, te.description || null]
      );
      if (check.rows.length === 0) {
        await client.query(
          `INSERT INTO time_entries (project_id, employee_id, manager_id, start_time, end_time, duration_minutes, cost, description, is_active)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true)`,
          [pid, eid, managerId, start, end, durationMinutes, Math.round((te.hours || durationMinutes/60) * 1000) / 1000, te.description || null]
        );
      }
    }

    // Enforce: at most two projects with status 'to_do' and promote some 'active' to 'to_do' if needed
    const todoRes = await client.query("SELECT id FROM projects WHERE LOWER(status) IN ('to_do','todo') ORDER BY created_at ASC");
    let todoCount = todoRes.rows.length;
    if (todoCount > 2) {
      // Keep the first two, reset the rest to 'active'
      const reset = todoRes.rows.slice(2).map(r => r.id);
      if (reset.length > 0) {
        await client.query(`UPDATE projects SET status='active' WHERE id = ANY($1::uuid[])`, [reset]);
      }
      todoCount = 2;
    }
    if (todoCount < 2) {
      const need = 2 - todoCount;
      const actRes = await client.query(`SELECT id FROM projects WHERE LOWER(status) = 'active' ORDER BY created_at ASC LIMIT $1`, [need]);
      const promote = actRes.rows.map(r => r.id);
      if (promote.length > 0) {
        await client.query(`UPDATE projects SET status='to_do' WHERE id = ANY($1::uuid[])`, [promote]);
      }
    }

    await client.query('COMMIT');
    console.log('✅ Mobile data imported successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Import failed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();


