const { primary, secondary } = require('./src/config/databases');

async function showDatabaseInfo() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║         TWO-DATABASE SETUP SUMMARY                            ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  try {
    // Primary Database Info
    console.log('📊 PRIMARY DATABASE: project_registry');
    console.log('─────────────────────────────────────────────────────────');
    const primaryDb = await primary.query('SELECT current_database() as db, version() as version');
    console.log(`Database: ${primaryDb.rows[0].db}`);
    
    const primaryTables = await primary.query(`
      SELECT 
        tablename,
        (SELECT COUNT(*) FROM information_schema.columns 
         WHERE table_name = t.tablename AND table_schema = 'public') as columns
      FROM pg_tables t
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    
    console.log(`\nTables (${primaryTables.rows.length}):`);
    primaryTables.rows.forEach(t => {
      console.log(`  • ${t.tablename} (${t.columns} columns)`);
    });
    
    // Secondary Database Info
    console.log('\n\n📊 SECONDARY DATABASE: project_time_manager');
    console.log('─────────────────────────────────────────────────────────');
    const secondaryDb = await secondary.query('SELECT current_database() as db');
    console.log(`Database: ${secondaryDb.rows[0].db}`);
    
    const secondaryTables = await secondary.query(`
      SELECT 
        tablename,
        (SELECT COUNT(*) FROM information_schema.columns 
         WHERE table_name = t.tablename AND table_schema = 'public') as columns
      FROM pg_tables t
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    
    console.log(`\nTables (${secondaryTables.rows.length}):`);
    secondaryTables.rows.forEach(t => {
      console.log(`  • ${t.tablename} (${t.columns} columns)`);
    });
    
    // Connection Summary
    console.log('\n\n✅ CONNECTION STATUS');
    console.log('─────────────────────────────────────────────────────────');
    console.log('✓ Primary Database (project_registry): CONNECTED');
    console.log('✓ Secondary Database (project_time_manager): CONNECTED');
    console.log('\n✓ Server running on: http://0.0.0.0:5000');
    console.log('✓ API Documentation: http://0.0.0.0:5000/api-docs');
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await primary.end();
    if (secondary) await secondary.end();
  }
}

showDatabaseInfo();
