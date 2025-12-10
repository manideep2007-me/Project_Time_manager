// Script to create the secondary database and apply schema
// Run this with PowerShell: node scripts/create-secondary-db.js

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function createSecondaryDatabase() {
  // Step 1: Connect to postgres database to create the new database
  const adminClient = new Client({
    host: 'localhost',
    port: 5432,
    database: 'postgres', // Connect to default postgres database
    user: 'postgres',
    password: 'Super@123',
  });

  try {
    console.log('Connecting to PostgreSQL...');
    await adminClient.connect();

    // Step 2: Check if database already exists
    const checkDb = await adminClient.query(
      "SELECT 1 FROM pg_database WHERE datname = 'project_registry'"
    );

    if (checkDb.rows.length > 0) {
      console.log('✓ Database "project_registry" already exists');
    } else {
      // Step 3: Create the new database
      console.log('Creating database "project_registry"...');
      await adminClient.query('CREATE DATABASE project_registry');
      console.log('✓ Database "project_registry" created successfully');
    }

    await adminClient.end();

    // Step 4: Connect to the new database and apply schema
    const dbClient = new Client({
      host: 'localhost',
      port: 5432,
      database: 'project_registry',
      user: 'postgres',
      password: 'Super@123',
    });

    console.log('Connecting to "project_registry" database...');
    await dbClient.connect();

    // Step 5: Read and execute schema file
    const schemaPath = path.join(__dirname, '../database/secondary-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('Applying schema...');
    await dbClient.query(schema);
    console.log('✓ Schema applied successfully');

    // Step 6: Verify tables were created
    const tables = await dbClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    console.log('\n✓ Tables created:');
    tables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    await dbClient.end();

    console.log('\n✅ Secondary database setup complete!');
    console.log('\nNext steps:');
    console.log('1. Add these to your .env file:');
    console.log('   DB2_HOST=localhost');
    console.log('   DB2_PORT=5432');
    console.log('   DB2_NAME=project_registry');
    console.log('   DB2_USER=postgres');
    console.log('   DB2_PASSWORD=Super@123');
    console.log('\n2. Restart your backend server');
    console.log('3. Run: npm run test-db (to verify both databases)');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === '42P04') {
      console.log('Database already exists, continuing...');
    } else {
      throw error;
    }
  }
}

createSecondaryDatabase()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Failed:', err);
    process.exit(1);
  });
