const { secondary: registryPool } = require('./src/config/databases');

async function checkSchema() {
  try {
    // Check organizations_registry columns
    const orgCols = await registryPool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'organizations_registry'
      ORDER BY ordinal_position
    `);
    console.log('=== organizations_registry columns ===');
    orgCols.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));
    
    // Check employees_registry columns
    const empCols = await registryPool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'employees_registry'
      ORDER BY ordinal_position
    `);
    console.log('\n=== employees_registry columns ===');
    empCols.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));
    
    // Sample data from organizations_registry
    const orgs = await registryPool.query('SELECT * FROM organizations_registry LIMIT 2');
    console.log('\n=== Sample organizations_registry data ===');
    console.log(orgs.rows);
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await registryPool.end();
  }
}

checkSchema();
