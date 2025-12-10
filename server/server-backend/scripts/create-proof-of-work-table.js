// Script to create proof_of_work table in the database

require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function createProofOfWorkTable() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'project_time_manager',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✓ Connected\n');

    // Read the schema file
    const schemaPath = path.join(__dirname, '../database/proof-of-work-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('Creating proof_of_work table...');
    await client.query(schema);
    console.log('✓ Table created successfully\n');

    // Verify table creation
    const verifyResult = await client.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'proof_of_work'
      ORDER BY ordinal_position;
    `);

    console.log('✓ Table structure verified:');
    console.log('Columns:');
    verifyResult.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''})`);
    });

    console.log('\n✅ Proof of Work table setup complete!');
    console.log('\nYou can now:');
    console.log('1. Start capturing proof of work with location and time verification');
    console.log('2. Use the ProofOfWorkCaptureScreen in your React Native app');
    console.log('3. Upload proofs via POST /api/proof-of-work/upload');

  } catch (error) {
    console.error('\n❌ Error creating table:');
    console.error(error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createProofOfWorkTable();
