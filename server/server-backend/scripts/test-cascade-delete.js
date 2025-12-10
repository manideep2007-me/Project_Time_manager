const pool = require('../src/config/database');

async function testCascadeDelete() {
  try {
    console.log('🔍 Checking clients and their project counts...\n');
    
    const result = await pool.query(`
      SELECT 
        c.id,
        c.name,
        c.email,
        COUNT(p.id) as project_count
      FROM clients c
      LEFT JOIN projects p ON c.id = p.client_id
      GROUP BY c.id, c.name, c.email
      ORDER BY project_count DESC, c.name
    `);

    console.log('📊 Current clients:\n');
    console.log('ID'.padEnd(10) + 'Name'.padEnd(30) + 'Email'.padEnd(35) + 'Projects');
    console.log('─'.repeat(85));
    
    result.rows.forEach(client => {
      console.log(
        client.id.toString().padEnd(10) +
        client.name.padEnd(30) +
        (client.email || '').padEnd(35) +
        client.project_count
      );
    });

    console.log('\n✅ Total clients:', result.rows.length);
    console.log('\n💡 To delete a client WITH their projects, use:');
    console.log('   DELETE FROM clients WHERE id = <client_id>');
    console.log('\n⚠️  This will CASCADE delete all projects and related data for that client.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

testCascadeDelete();
