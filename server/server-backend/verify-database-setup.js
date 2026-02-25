const { primary, secondary, getPool } = require('./src/config/databases');

async function verifySetup() {
  console.log('=== Verifying Database Setup ===\n');
  
  try {
    // Check Primary Database
    console.log('1. Primary Database (project_registry):');
    const primaryResult = await primary.query('SELECT current_database() as db');
    console.log(`   ✓ Connected to: ${primaryResult.rows[0].db}`);
    
    const primaryTables = await primary.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    console.log(`   ✓ Tables: ${primaryTables.rows.map(r => r.tablename).join(', ') || 'None'}`);
    
    // Check Secondary Database
    console.log('\n2. Secondary Database (project_time_manager):');
    const secondaryResult = await secondary.query('SELECT current_database() as db');
    console.log(`   ✓ Connected to: ${secondaryResult.rows[0].db}`);
    
    const secondaryTables = await secondary.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
      LIMIT 10
    `);
    console.log(`   ✓ Tables (first 10): ${secondaryTables.rows.map(r => r.tablename).join(', ')}`);
    
    // Check audit_logs table location
    console.log('\n3. Checking audit_logs table:');
    try {
      const primaryAudit = await primary.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'audit_logs'
        );
      `);
      if (primaryAudit.rows[0].exists) {
        console.log('   ✓ audit_logs found in project_registry (Primary)');
      } else {
        console.log('   ✗ audit_logs NOT found in project_registry');
      }
    } catch (err) {
      console.log(`   Error checking primary: ${err.message}`);
    }
    
    try {
      const secondaryAudit = await secondary.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'audit_logs'
        );
      `);
      if (secondaryAudit.rows[0].exists) {
        console.log('   ✓ audit_logs found in project_time_manager (Secondary)');
      } else {
        console.log('   ✗ audit_logs NOT found in project_time_manager');
      }
    } catch (err) {
      console.log(`   Error checking secondary: ${err.message}`);
    }
    
    console.log('\n✓ Database setup verification complete!');
    
  } catch (err) {
    console.error('Error during verification:', err.message);
  } finally {
    await primary.end();
    if (secondary) await secondary.end();
  }
}

verifySetup();
