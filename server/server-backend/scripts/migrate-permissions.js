const pool = require('../src/config/database');

const NEW_PERMISSIONS = [
  { name: 'clients.add', description: 'Add Client Button' },
  { name: 'projects.add', description: 'Add Project Button' },
  { name: 'tasks.add', description: 'Add Task Button' },
  { name: 'employees.add', description: 'Add Employee Button' },
  { name: 'clients.delete', description: 'Delete Client Button' },
  { name: 'projects.delete', description: 'Delete Project Button' },
  { name: 'tasks.delete', description: 'Delete Task Button' },
];

async function migratePermissions() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log('🗑️  Deleting old dummy permissions...');
    // Delete old permissions (this will cascade to role_permissions)
    const oldPermissions = [
      'dashboard_view', 
      'view_management', 
      'user_management', 
      'content_creation', 
      'content_editing', 
      'content_deletion', 
      'analytics_access', 
      'report_generation'
    ];
    
    for (const oldPerm of oldPermissions) {
      await client.query('DELETE FROM permissions WHERE name = $1', [oldPerm]);
      console.log(`   ❌ Deleted: ${oldPerm}`);
    }
    
    console.log('\n✅ Adding new real permissions...');
    // Add new permissions
    for (const perm of NEW_PERMISSIONS) {
      await client.query(
        `INSERT INTO permissions (name, description)
         VALUES ($1, $2)
         ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description`,
        [perm.name, perm.description]
      );
      console.log(`   ✅ Added: ${perm.description} (${perm.name})`);
    }
    
    console.log('\n🔧 Setting up default role permissions...');
    // Get all new permission IDs
    const { rows: perms } = await client.query('SELECT id, name FROM permissions');
    
    for (const perm of perms) {
      // Admin gets all permissions
      await client.query(
        `INSERT INTO role_permissions (role_name, permission_id, has_access)
         VALUES ('admin', $1, true)
         ON CONFLICT (role_name, permission_id) DO UPDATE SET has_access = true`,
        [perm.id]
      );
      
      // Manager gets most permissions by default
      const managerHas = [
        'clients.add', 'projects.add', 'tasks.add', 
        'clients.delete', 'projects.delete', 'tasks.delete'
      ].includes(perm.name);
      await client.query(
        `INSERT INTO role_permissions (role_name, permission_id, has_access)
         VALUES ('manager', $1, $2)
         ON CONFLICT (role_name, permission_id) DO UPDATE SET has_access = $2`,
        [perm.id, managerHas]
      );
      
      // Employee gets no permissions by default
      await client.query(
        `INSERT INTO role_permissions (role_name, permission_id, has_access)
         VALUES ('employee', $1, false)
         ON CONFLICT (role_name, permission_id) DO UPDATE SET has_access = false`,
        [perm.id]
      );
    }
    
    await client.query('COMMIT');
    console.log('\n✅ Migration completed successfully!');
    console.log('📱 Refresh your mobile app to see the new permissions.');
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migratePermissions().catch(console.error);
