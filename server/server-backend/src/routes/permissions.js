const express = require('express');
const pool = require('../config/database');
const { authenticateToken, requireRole, getDbPool } = require('../middleware/auth');

const router = express.Router();

const DEFAULT_PERMISSIONS = [
  // Client permissions
  { name: 'clients.view', description: 'View Clients', category: 'manage_client' },
  { name: 'clients.add', description: 'Add Client', category: 'manage_client' },
  { name: 'clients.edit', description: 'Edit Client', category: 'manage_client' },
  { name: 'clients.delete', description: 'Delete Client', category: 'manage_client' },
  
  // Project permissions
  { name: 'projects.view', description: 'View Projects', category: 'manage_project' },
  { name: 'projects.add', description: 'Add Project', category: 'manage_project' },
  { name: 'projects.edit', description: 'Edit Project', category: 'manage_project' },
  { name: 'projects.delete', description: 'Delete Project', category: 'manage_project' },
  
  // Task permissions
  { name: 'tasks.view', description: 'View Tasks', category: 'manage_task' },
  { name: 'tasks.add', description: 'Add Task', category: 'manage_task' },
  { name: 'tasks.edit', description: 'Edit Task', category: 'manage_task' },
  { name: 'tasks.delete', description: 'Delete Task', category: 'manage_task' },
  
  // Employee permissions
  { name: 'employees.view', description: 'View Employees', category: 'manage_employee' },
  { name: 'employees.add', description: 'Add Employee', category: 'manage_employee' },
  { name: 'employees.edit', description: 'Edit Employee', category: 'manage_employee' },
  { name: 'employees.delete', description: 'Delete Employee', category: 'manage_employee' },
  
  // Attachments permissions
  { name: 'attachments.view', description: 'View Attachments', category: 'manage_attachments' },
  { name: 'attachments.add', description: 'Add Attachments', category: 'manage_attachments' },
  { name: 'attachments.edit', description: 'Edit Attachments', category: 'manage_attachments' },
  { name: 'attachments.delete', description: 'Delete Attachments', category: 'manage_attachments' },
  
  // Expenses permissions
  { name: 'expenses.view', description: 'View Expenses', category: 'expenses' },
  { name: 'expenses.approve', description: 'Approve Expenses', category: 'expenses' },
  
  // Attendance permissions
  { name: 'attendance.view', description: 'View Attendance', category: 'attendance' },
  { name: 'attendance.approve', description: 'Approve Attendance', category: 'attendance' },
  
  // Other permissions
  { name: 'tasks.priority', description: 'Set Task Priority', category: 'other' },
];

async function ensureRbacInitialized(db) {
  // Ensure types and tables exist (idempotent)
  await db.query(`
    DO $$ BEGIN
      CREATE TYPE user_role AS ENUM ('admin', 'manager', 'employee');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS roles (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name user_role UNIQUE NOT NULL,
      description TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS permissions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(100) UNIQUE NOT NULL,
      description TEXT,
      category VARCHAR(50),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  // Add category column if it doesn't exist
  await db.query(`
    DO $$ BEGIN
      ALTER TABLE permissions ADD COLUMN IF NOT EXISTS category VARCHAR(50);
    EXCEPTION WHEN duplicate_column THEN NULL; END $$;
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS role_permissions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      role_name user_role NOT NULL,
      permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
      has_access BOOLEAN NOT NULL DEFAULT false,
      UNIQUE(role_name, permission_id)
    );
  `);
  
  // Create user_permissions table for individual user overrides
  await db.query(`
    CREATE TABLE IF NOT EXISTS user_permissions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL,
      permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
      has_access BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, permission_id)
    );
  `);

  // Upsert roles
  const roles = ['admin', 'manager', 'employee'];
  for (const name of roles) {
    await db.query(
      `INSERT INTO roles (name, description)
       VALUES ($1, $2)
       ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description`,
      [name, `${name} role`]
    );
  }

  // Delete old dummy permissions that are not in DEFAULT_PERMISSIONS
  const allowedNames = DEFAULT_PERMISSIONS.map(p => p.name);
  await db.query(
    `DELETE FROM permissions WHERE name NOT IN (${allowedNames.map((_, i) => `$${i + 1}`).join(',')})`,
    allowedNames
  );

  // Upsert permissions
  for (const p of DEFAULT_PERMISSIONS) {
    await db.query(
      `INSERT INTO permissions (name, description, category)
       VALUES ($1, $2, $3)
       ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, category = EXCLUDED.category`,
      [p.name, p.description, p.category || null]
    );
  }

  // Ensure mappings exist
  const { rows: perms } = await db.query('SELECT id, name FROM permissions');
  for (const perm of perms) {
    // Admin full
    await db.query(
      `INSERT INTO role_permissions (role_name, permission_id, has_access)
       VALUES ('admin', $1, true)
       ON CONFLICT (role_name, permission_id) DO NOTHING`,
      [perm.id]
    );

    // Manager has most permissions by default (can be changed by admin)
    const managerHas = [
      // View permissions
      'clients.view', 'projects.view', 'tasks.view', 'employees.view', 
      'attachments.view', 'expenses.view', 'attendance.view',
      // Add/Edit permissions
      'clients.add', 'projects.add', 'tasks.add', 'employees.add',
      'clients.edit', 'projects.edit', 'tasks.edit', 'employees.edit',
      'attachments.add', 'attachments.edit',
      // Delete permissions
      'clients.delete', 'projects.delete', 'tasks.delete',
      // Approval permissions
      'expenses.approve', 'attendance.approve', 'tasks.priority'
    ].includes(perm.name);
    await db.query(
      `INSERT INTO role_permissions (role_name, permission_id, has_access)
       VALUES ('manager', $1, $2)
       ON CONFLICT (role_name, permission_id) DO NOTHING`,
      [perm.id, managerHas]
    );

    // Employee has limited permissions by default
    const employeeHas = [
      'tasks.view', 'projects.view', 'attachments.view', 'attachments.add'
    ].includes(perm.name);
    await db.query(
      `INSERT INTO role_permissions (role_name, permission_id, has_access)
       VALUES ('employee', $1, $2)
       ON CONFLICT (role_name, permission_id) DO NOTHING`,
      [perm.id, employeeHas]
    );
  }
}

// GET /api/permissions
router.get('/', authenticateToken, async (req, res) => {
  // Allow all authenticated users to view permissions (they can only see their role's permissions anyway)
  try {
    const db = getDbPool(req);
    await ensureRbacInitialized(db);
    const { rows: permissions } = await db.query('SELECT id, name, description, category FROM permissions ORDER BY category, name');

    // Build access matrix per role
    const roles = ['admin', 'manager', 'employee'];
    const { rows: mappings } = await db.query(
      'SELECT role_name, permission_id, has_access FROM role_permissions'
    );

    const accessByPerm = new Map();
    for (const p of permissions) {
      accessByPerm.set(p.id, { admin: false, manager: false, employee: false });
    }
    for (const m of mappings) {
      if (accessByPerm.has(m.permission_id)) {
        accessByPerm.get(m.permission_id)[m.role_name] = m.has_access;
      }
    }

    const result = permissions.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      category: p.category,
      access: accessByPerm.get(p.id)
    }));

    res.json({ roles, permissions: result });
  } catch (err) {
    console.error('GET /api/permissions failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch permissions', details: err.message });
  }
});

// POST /api/permissions/update
router.post('/update', authenticateToken, requireRole(['admin']), async (req, res) => {
  const updates = Array.isArray(req.body?.updates) ? req.body.updates : [];
  if (updates.length === 0) return res.json({ message: 'No changes' });

  const db = getDbPool(req);
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    for (const u of updates) {
      const role = u.role;
      const permissionId = u.permissionId;
      const has = !!u.hasAccess;
      await client.query(
        `INSERT INTO role_permissions (role_name, permission_id, has_access)
         VALUES ($1, $2, $3)
         ON CONFLICT (role_name, permission_id)
         DO UPDATE SET has_access = EXCLUDED.has_access`,
        [role, permissionId, has]
      );
    }
    await client.query('COMMIT');
    res.json({ message: 'Permissions updated' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to update permissions' });
  } finally {
    client.release();
  }
});

// GET /api/permissions/user/:userId - Get permissions for a specific user
router.get('/user/:userId', authenticateToken, requireRole(['admin']), async (req, res) => {
  const { userId } = req.params;
  
  try {
    const db = getDbPool(req);
    await ensureRbacInitialized(db);
    
    // Get all permissions
    const { rows: permissions } = await db.query('SELECT id, name, description, category FROM permissions ORDER BY category, name');
    
    // Get user-specific permission overrides
    const { rows: userPerms } = await db.query(
      'SELECT permission_id, has_access FROM user_permissions WHERE user_id = $1',
      [userId]
    );
    
    // Build a map of user permissions
    const userPermMap = new Map();
    for (const up of userPerms) {
      userPermMap.set(up.permission_id, up.has_access);
    }
    
    // Get user's role to determine base permissions
    const { rows: userRows } = await db.query(
      'SELECT role FROM users WHERE user_id = $1',
      [userId]
    );
    const userRole = userRows[0]?.role || 'employee';
    
    // Get role-based permissions
    const { rows: rolePerms } = await db.query(
      'SELECT permission_id, has_access FROM role_permissions WHERE role_name = $1',
      [userRole]
    );
    const rolePermMap = new Map();
    for (const rp of rolePerms) {
      rolePermMap.set(rp.permission_id, rp.has_access);
    }
    
    // Build result with effective permissions (user override > role default)
    const result = permissions.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      category: p.category,
      hasAccess: userPermMap.has(p.id) ? userPermMap.get(p.id) : (rolePermMap.get(p.id) || false),
      isOverride: userPermMap.has(p.id)
    }));
    
    res.json({ userId, userRole, permissions: result });
  } catch (err) {
    console.error('GET /api/permissions/user/:userId failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch user permissions', details: err.message });
  }
});

// POST /api/permissions/user/:userId - Update permissions for a specific user
router.post('/user/:userId', authenticateToken, requireRole(['admin']), async (req, res) => {
  const { userId } = req.params;
  const updates = Array.isArray(req.body?.updates) ? req.body.updates : [];
  
  if (updates.length === 0) return res.json({ message: 'No changes' });

  const db = getDbPool(req);
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    
    for (const u of updates) {
      const permissionId = u.permissionId;
      const hasAccess = !!u.hasAccess;
      const clearOverride = u.clearOverride === true;
      
      if (clearOverride) {
        // Remove user-specific override, fall back to role permission
        await client.query(
          'DELETE FROM user_permissions WHERE user_id = $1 AND permission_id = $2',
          [userId, permissionId]
        );
      } else {
        // Set user-specific permission
        await client.query(
          `INSERT INTO user_permissions (user_id, permission_id, has_access, updated_at)
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
           ON CONFLICT (user_id, permission_id)
           DO UPDATE SET has_access = EXCLUDED.has_access, updated_at = CURRENT_TIMESTAMP`,
          [userId, permissionId, hasAccess]
        );
      }
    }
    
    await client.query('COMMIT');
    res.json({ message: 'User permissions updated' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /api/permissions/user/:userId failed:', err.message);
    res.status(500).json({ error: 'Failed to update user permissions' });
  } finally {
    client.release();
  }
});

module.exports = router;


