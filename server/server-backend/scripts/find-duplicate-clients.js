/*
  Find and optionally merge duplicate clients (same email or name).
  Usage:
    node scripts/find-duplicate-clients.js        # Just list duplicates
    node scripts/find-duplicate-clients.js merge  # Merge projects to older client and delete newer ones
*/

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const pool = require('../src/config/database');

async function findDuplicates() {
  const { rows: byEmail } = await pool.query(`
    SELECT email, array_agg(id ORDER BY created_at) as ids, array_agg(name) as names, COUNT(*) as count
    FROM clients
    WHERE email IS NOT NULL
    GROUP BY email
    HAVING COUNT(*) > 1
  `);

  const { rows: byName } = await pool.query(`
    SELECT name, array_agg(id ORDER BY created_at) as ids, array_agg(email) as emails, COUNT(*) as count
    FROM clients
    GROUP BY name
    HAVING COUNT(*) > 1
  `);

  return { byEmail, byName };
}

async function run() {
  const mode = process.argv[2]; // 'merge' or nothing
  try {
    console.log('🔍 Scanning for duplicate clients...\n');

    const { byEmail, byName } = await findDuplicates();

    if (byEmail.length === 0 && byName.length === 0) {
      console.log('✅ No duplicate clients found.');
      return;
    }

    console.log('📧 Duplicates by email:');
    byEmail.forEach((dup, i) => {
      console.log('  ' + (i + 1) + '. ' + dup.email + ' (' + dup.count + ' entries)');
      dup.ids.forEach((id, j) => console.log('     ' + (j + 1) + '. ' + id + ' - "' + dup.names[j] + '"'));
    });

    console.log('\n📝 Duplicates by name:');
    byName.forEach((dup, i) => {
      console.log('  ' + (i + 1) + '. "' + dup.name + '" (' + dup.count + ' entries)');
      dup.ids.forEach((id, j) => console.log('     ' + (j + 1) + '. ' + id + ' - ' + (dup.emails[j] || '(no email)')));
    });

    if (mode === 'merge') {
      console.log('\n🔄 Merging duplicates (keeping oldest, moving projects)...\n');
      
      // Merge by name (more reliable for your case)
      for (const dup of byName) {
        const [keepId, ...deleteIds] = dup.ids;
        console.log('  Keeping: ' + keepId + ' ("' + dup.name + '")');
        
        for (const oldId of deleteIds) {
          // Move all projects from oldId to keepId
          const { rowCount } = await pool.query(
            'UPDATE projects SET client_id = $1 WHERE client_id = $2',
            [keepId, oldId]
          );
          console.log('    Moved ' + rowCount + ' project(s) from ' + oldId + ' to ' + keepId);
          
          // Delete the duplicate
          await pool.query('DELETE FROM clients WHERE id = $1', [oldId]);
          console.log('    Deleted duplicate ' + oldId);
        }
      }

      console.log('\n✅ Merge complete! Run check-mapping again to verify.');
    } else {
      console.log('\n💡 To merge duplicates (keeping the oldest), run:');
      console.log('   npm run dedupe-clients');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

run();
