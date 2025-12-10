/*
  Quick diagnostic to verify projects are linked to clients correctly.
  Uses the same Pool as the server code to avoid .env mismatches.
*/

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const pool = require('../src/config/database');

async function run() {
  try {
    console.log('🔎 Checking project ↔ client mapping...');

    const { rows } = await pool.query(`
      SELECT 
        p.id as project_id,
        p.name as project_name,
        p.client_id,
        c.id as client_id_join,
        c.name as client_name
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      ORDER BY p.created_at DESC
      LIMIT 50
    `);

    if (rows.length === 0) {
      console.log('ℹ️ No projects found.');
    } else {
      const orphans = rows.filter(r => !r.client_id_join);
      console.log(`🧮 Rows inspected: ${rows.length}`);
      console.log(`✅ With matching client: ${rows.length - orphans.length}`);
      console.log(`❗ Orphaned (client_id not found in clients): ${orphans.length}`);

      if (orphans.length > 0) {
        console.log('\n🚩 Example orphaned rows:');
        orphans.slice(0, 5).forEach((r, i) => {
          console.log(`  ${i + 1}. project_id=${r.project_id} name="${r.project_name}" client_id=${r.client_id}`);
        });
      }

      // Group by client
      const byClient = new Map();
      rows.forEach(r => {
        const key = r.client_id_join || '(missing)';
        if (!byClient.has(key)) byClient.set(key, { name: r.client_name || '(missing)', count: 0 });
        byClient.get(key).count++;
      });
      console.log('\n📊 Projects by client (top 10):');
      Array.from(byClient.entries()).slice(0, 10).forEach(([id, info]) => {
        console.log(`  • ${info.name} (${id}) => ${info.count}`);
      });
    }

    // Sanity-check a specific client if provided
    const argClientId = process.argv[2];
    if (argClientId) {
      const q = await pool.query(
        `SELECT id, name FROM projects WHERE client_id = $1 ORDER BY created_at DESC LIMIT 10`,
        [argClientId]
      );
      console.log(`\n🔗 Projects for client_id=${argClientId}: ${q.rowCount}`);
      q.rows.forEach((r, i) => console.log(`  ${i + 1}. ${r.name} (${r.id})`));
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

run();
