/*
  Shows which clients can be safely deleted (those with 0 projects).
  Usage: npm run safe-delete-clients
*/

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const pool = require('../src/config/database');

async function run() {
  try {
    console.log('🔍 Finding clients safe to delete...\n');

    const { rows } = await pool.query(`
      SELECT 
        c.id,
        c.name,
        c.email,
        c.created_at,
        COUNT(p.id) as project_count
      FROM clients c
      LEFT JOIN projects p ON c.id = p.client_id
      GROUP BY c.id, c.name, c.email, c.created_at
      ORDER BY project_count ASC, c.created_at DESC
    `);

    const canDelete = rows.filter(r => parseInt(r.project_count) === 0);
    const cannotDelete = rows.filter(r => parseInt(r.project_count) > 0);

    console.log('✅ Safe to delete (' + canDelete.length + ' clients with 0 projects):');
    if (canDelete.length === 0) {
      console.log('   (none)');
    } else {
      canDelete.forEach((c, i) => {
        const shortId = c.id.substring(0, 8);
        const date = new Date(c.created_at).toLocaleDateString();
        console.log('  ' + (i + 1) + '. ' + c.name + ' (' + shortId + '...) - ' + c.email + ' - Created: ' + date);
      });
    }

    console.log('\n🚫 Cannot delete (' + cannotDelete.length + ' clients with projects):');
    if (cannotDelete.length === 0) {
      console.log('   (none)');
    } else {
      cannotDelete.slice(0, 10).forEach((c, i) => {
        const shortId = c.id.substring(0, 8);
        console.log('  ' + (i + 1) + '. ' + c.name + ' (' + shortId + '...) - ' + c.project_count + ' project(s)');
      });
      if (cannotDelete.length > 10) {
        console.log('  ... and ' + (cannotDelete.length - 10) + ' more');
      }
    }

    console.log('\n💡 Tip: Delete clients from the mobile app or use:');
    console.log('   curl -X DELETE http://localhost:5000/api/clients/<client-id> -H "Authorization: Bearer <token>"');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

run();
