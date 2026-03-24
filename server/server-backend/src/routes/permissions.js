const express = require('express');
const pool = require('../config/database');
const { authenticateToken, requireRole, getDbPool } = require('../middleware/auth');

const router = express.Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VALID_ROLES = ['admin', 'manager', 'employee'];

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

async function resolveEffectiveRoleFromDesignation(db, userId, fallbackRole) {
  const normalizedFallbackRole = String(fallbackRole || 'employee').toLowerCase();

  // Keep admin behavior unchanged.
  if (normalizedFallbackRole === 'admin') {
    return 'admin';
  }

  if (!userId) {
    return 'employee';
  }

  try {
    const { rows } = await db.query(
      `SELECT d.name AS designation_name
       FROM users u
       LEFT JOIN designations d ON u.designation_id = d.designation_id
       WHERE u.user_id = $1
       LIMIT 1`,
      [userId]
    );

    const designationName = String(rows[0]?.designation_name || '').trim().toLowerCase();
    return designationName === 'manager' ? 'manager' : 'employee';
  } catch (err) {
    console.warn('[permissions] designation lookup failed, defaulting to employee:', err.message);
    return 'employee';
  }
}

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
  // Add FK for data integrity (idempotent)
  await db.query(`
    DO $$ BEGIN
      ALTER TABLE user_permissions
      ADD CONSTRAINT user_permissions_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
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
  if (updates.length === 0) {
    return res.status(400).json({ error: 'updates array is required and cannot be empty' });
  }

  const db = getDbPool(req);
  const client = await db.connect();
  try {
    await ensureRbacInitialized(client);
    // Validate payload shape and normalize duplicate updates (last one wins)
    const normalizedByKey = new Map();
    for (const u of updates) {
      if (!u || typeof u !== 'object') {
        return res.status(400).json({ error: 'Each update must be an object' });
      }
      const role = u.role;
      const permissionId = u.permissionId;
      if (!VALID_ROLES.includes(role)) {
        return res.status(400).json({ error: `Invalid role: ${role}` });
      }
      if (!permissionId || typeof permissionId !== 'string' || !UUID_RE.test(permissionId)) {
        return res.status(400).json({ error: 'permissionId must be a valid UUID' });
      }
      if (typeof u.hasAccess !== 'boolean') {
        return res.status(400).json({ error: 'hasAccess must be boolean' });
      }
      normalizedByKey.set(`${role}:${permissionId}`, {
        role,
        permissionId,
        hasAccess: u.hasAccess,
      });
    }

    const normalizedUpdates = Array.from(normalizedByKey.values());
    const permissionIds = normalizedUpdates.map((u) => u.permissionId);
    const { rows: existingPerms } = await client.query(
      'SELECT id FROM permissions WHERE id = ANY($1::uuid[])',
      [permissionIds]
    );
    const existingPermSet = new Set(existingPerms.map((p) => p.id));
    const invalidPermissionIds = permissionIds.filter((id) => !existingPermSet.has(id));
    if (invalidPermissionIds.length > 0) {
      return res.status(404).json({ error: 'Some permission IDs were not found', invalidPermissionIds });
    }

    await client.query('BEGIN');
    for (const u of normalizedUpdates) {
      await client.query(
        `INSERT INTO role_permissions (role_name, permission_id, has_access)
         VALUES ($1, $2, $3)
         ON CONFLICT (role_name, permission_id)
         DO UPDATE SET has_access = EXCLUDED.has_access`,
        [u.role, u.permissionId, u.hasAccess]
      );
    }
    await client.query('COMMIT');
    res.status(200).json({ message: 'Permissions updated', updatedCount: normalizedUpdates.length });
  } catch (err) {
    await client.query('ROLLBACK');
    const msg = String(err?.message || '');
    if (msg.includes('Invalid role')) {
      return res.status(400).json({ error: msg });
    }
    console.error('POST /api/permissions/update failed:', err.message);
    res.status(500).json({ error: 'Failed to update permissions' });
  } finally {
    client.release();
  }
});

// GET /api/permissions/my - Get merged permissions for the currently logged-in user
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const db = getDbPool(req);
    await ensureRbacInitialized(db);

    // Resolve the org-local user_id from the JWT (which may carry a registry UUID)
    const email = req.user?.email;
    let userId = req.user?.id;
    if (email) {
      const { rows } = await db.query(
        'SELECT user_id FROM users WHERE LOWER(email_id) = LOWER($1) LIMIT 1',
        [email]
      );
      if (rows.length > 0) userId = rows[0].user_id;
    }

    const role = await resolveEffectiveRoleFromDesignation(db, userId, req.user?.role);
    console.log(`[permissions/my] userId=${userId} effectiveRole=${role} email=${email}`);

    // Role-based defaults
    const { rows: rolePerms } = await db.query(
      'SELECT p.name, rp.has_access FROM role_permissions rp JOIN permissions p ON p.id = rp.permission_id WHERE rp.role_name = $1',
      [role]
    );
    const merged = {};
    for (const rp of rolePerms) {
      merged[rp.name] = rp.has_access;
    }

    // User-specific overrides (only explicit grants)
    const { rows: userPerms } = await db.query(
      'SELECT p.name, up.has_access FROM user_permissions up JOIN permissions p ON p.id = up.permission_id WHERE up.user_id = $1',
      [userId]
    );
    for (const up of userPerms) {
      if (up.has_access === true) {
        merged[up.name] = true;
      }
    }

    const permissions = Object.entries(merged).map(([name, hasAccess]) => ({
      name,
      hasAccess: !!hasAccess,
    }));

    console.log(`[permissions/my] returning ${permissions.filter(p => p.hasAccess).length} granted permissions`);
    res.json({ permissions });
  } catch (err) {
    console.error('GET /api/permissions/my failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch permissions', details: err.message });
  }
});

// GET /api/permissions/user/:userId - Get permissions for a specific user
router.get('/user/:userId', authenticateToken, requireRole(['admin']), async (req, res) => {
  const { userId } = req.params;
  if (!UUID_RE.test(String(userId))) {
    return res.status(400).json({ error: 'userId must be a valid UUID' });
  }
  
  try {
    const db = getDbPool(req);
    await ensureRbacInitialized(db);
    // Ensure target user exists in this org database
    const { rows: existingUser } = await db.query(
      'SELECT user_id FROM users WHERE user_id = $1',
      [userId]
    );
    if (existingUser.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
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
  if (!UUID_RE.test(String(userId))) {
    return res.status(400).json({ error: 'userId must be a valid UUID' });
  }
  
  if (updates.length === 0) {
    return res.status(400).json({ error: 'updates array is required and cannot be empty' });
  }

  const db = getDbPool(req);
  const client = await db.connect();
  try {
    await ensureRbacInitialized(client);
    // Validate and normalize duplicate updates (last one wins)
    const normalizedByPerm = new Map();
    for (const u of updates) {
      if (!u || typeof u !== 'object') {
        return res.status(400).json({ error: 'Each update must be an object' });
      }
      const permissionId = u.permissionId;
      if (!permissionId || typeof permissionId !== 'string' || !UUID_RE.test(permissionId)) {
        return res.status(400).json({ error: 'permissionId must be a valid UUID' });
      }
      if (u.clearOverride === true) {
        normalizedByPerm.set(permissionId, { permissionId, clearOverride: true, hasAccess: false });
      } else if (typeof u.hasAccess === 'boolean') {
        normalizedByPerm.set(permissionId, { permissionId, clearOverride: false, hasAccess: u.hasAccess });
      } else {
        return res.status(400).json({ error: 'Each update must include boolean hasAccess or clearOverride=true' });
      }
    }

    const normalizedUpdates = Array.from(normalizedByPerm.values());
    const permissionIds = normalizedUpdates.map((u) => u.permissionId);
    const { rows: existingPerms } = await client.query(
      'SELECT id FROM permissions WHERE id = ANY($1::uuid[])',
      [permissionIds]
    );
    const existingPermSet = new Set(existingPerms.map((p) => p.id));
    const invalidPermissionIds = permissionIds.filter((id) => !existingPermSet.has(id));
    if (invalidPermissionIds.length > 0) {
      return res.status(404).json({ error: 'Some permission IDs were not found', invalidPermissionIds });
    }

    await client.query('BEGIN');
    // Ensure target user exists in this org database
    const { rows: existingUser } = await client.query(
      'SELECT user_id FROM users WHERE user_id = $1',
      [userId]
    );
    if (existingUser.length === 0) {
      throw new Error('User not found');
    }
    
    for (const u of normalizedUpdates) {
      if (u.clearOverride) {
        // Remove user-specific override, fall back to role permission
        await client.query(
          'DELETE FROM user_permissions WHERE user_id = $1 AND permission_id = $2',
          [userId, u.permissionId]
        );
      } else {
        // Set user-specific permission
        await client.query(
          `INSERT INTO user_permissions (user_id, permission_id, has_access, updated_at)
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
           ON CONFLICT (user_id, permission_id)
           DO UPDATE SET has_access = EXCLUDED.has_access, updated_at = CURRENT_TIMESTAMP`,
          [userId, u.permissionId, u.hasAccess]
        );
      }
    }
    
    await client.query('COMMIT');
    res.status(200).json({ message: 'User permissions updated', updatedCount: normalizedUpdates.length });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /api/permissions/user/:userId failed:', err.message);
    const msg = String(err?.message || '');
    if (msg.includes('User not found')) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (msg.includes('permissionId is required') || msg.includes('Invalid role')) {
      return res.status(400).json({ error: msg });
    }
    res.status(500).json({ error: 'Failed to update user permissions' });
  } finally {
    client.release();
  }
});

// GET /api/permissions/debug/:userId - Debug helper for role/default/override/final view
router.get('/debug/:userId', authenticateToken, requireRole(['admin']), async (req, res) => {
  const { userId } = req.params;
  if (!UUID_RE.test(String(userId))) {
    return res.status(400).json({ error: 'userId must be a valid UUID' });
  }

  try {
    const db = getDbPool(req);
    await ensureRbacInitialized(db);

    const { rows: userRows } = await db.query(
      'SELECT user_id, email_id, first_name, last_name, role FROM users WHERE user_id = $1',
      [userId]
    );
    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = userRows[0];

    const { rows: roleRows } = await db.query(
      `SELECT p.id as permission_id, p.name, rp.has_access
       FROM role_permissions rp
       JOIN permissions p ON p.id = rp.permission_id
       WHERE rp.role_name = $1
       ORDER BY p.name`,
      [user.role]
    );

    const { rows: overrideRows } = await db.query(
      `SELECT p.id as permission_id, p.name, up.has_access, up.updated_at
       FROM user_permissions up
       JOIN permissions p ON p.id = up.permission_id
       WHERE up.user_id = $1
       ORDER BY p.name`,
      [userId]
    );

    const mergedMap = new Map();
    for (const r of roleRows) {
      mergedMap.set(r.name, !!r.has_access);
    }
    for (const o of overrideRows) {
      mergedMap.set(o.name, !!o.has_access);
    }
    const merged = Array.from(mergedMap.entries())
      .map(([name, hasAccess]) => ({ name, hasAccess }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return res.status(200).json({
      user: {
        id: user.user_id,
        email: user.email_id,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        role: user.role,
      },
      rolePermissions: roleRows.map((r) => ({
        permissionId: r.permission_id,
        name: r.name,
        hasAccess: !!r.has_access,
      })),
      userOverrides: overrideRows.map((o) => ({
        permissionId: o.permission_id,
        name: o.name,
        hasAccess: !!o.has_access,
        updatedAt: o.updated_at,
      })),
      finalMergedPermissions: merged,
    });
  } catch (err) {
    console.error('GET /api/permissions/debug/:userId failed:', err.message);
    return res.status(500).json({ error: 'Failed to fetch debug permissions' });
  }
});

module.exports = router;


