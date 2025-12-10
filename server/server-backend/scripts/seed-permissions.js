const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const pool = require('../src/config/database');

const PERMISSIONS = [
  { name: 'dashboard_view', description: 'Dashboard View' },
  { name: 'view_management', description: 'View Management' },
  { name: 'user_management', description: 'User Management' },
  { name: 'content_creation', description: 'Content Creation' },
  { name: 'content_editing', description: 'Content Editing' },
  { name: 'content_deletion', description: 'Content Deletion' },
  { name: 'analytics_access', description: 'Analytics Access' },
  { name: 'report_generation', description: 'Report Generation' },
];

async function upsertRoles() {
  const roles = ['admin', 'manager', 'employee'];
  for (const name of roles) {
    await pool.query(
      `INSERT INTO roles (name, description)
       VALUES ($1, $2)
       ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description`,
      [name, `${name} role`]
    );
  }
}

async function upsertPermissions() {
  for (const p of PERMISSIONS) {
    await pool.query(
      `INSERT INTO permissions (name, description)
       VALUES ($1, $2)
       ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description`,
      [p.name, p.description]
    );
  }
}

async function setDefaults() {
  const { rows: perms } = await pool.query('SELECT id, name FROM permissions');

  const defaults = [];
  for (const perm of perms) {
    // Admin: full access
    defaults.push(['admin', perm.id, true]);

    // Manager: reasonable defaults
    const managerHas = [
      'dashboard_view',
      'view_management',
      'content_creation',
      'content_editing',
      'analytics_access',
      'report_generation',
    ].includes(perm.name);
    defaults.push(['manager', perm.id, managerHas]);

    // Employee: minimal access
    const employeeHas = [
      'dashboard_view',
      'view_management',
    ].includes(perm.name);
    defaults.push(['employee', perm.id, employeeHas]);
  }

  for (const [roleName, permissionId, has] of defaults) {
    await pool.query(
      `INSERT INTO role_permissions (role_name, permission_id, has_access)
       VALUES ($1, $2, $3)
       ON CONFLICT (role_name, permission_id)
       DO UPDATE SET has_access = EXCLUDED.has_access`,
      [roleName, permissionId, has]
    );
  }
}

async function main() {
  try {
    await upsertRoles();
    await upsertPermissions();
    await setDefaults();
    console.log('Permissions seeded successfully');
  } catch (err) {
    console.error('Failed to seed permissions:', err.message);
  } finally {
    await pool.end();
  }
}

main();


