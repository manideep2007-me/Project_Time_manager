#!/usr/bin/env node

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  database: process.env.DB_NAME || 'project_time_manager',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function renameSupervisorToManager() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Renaming supervisor_id to manager_id in database...');
    
    // Check if supervisor_id column exists
    const columnExists = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'time_entries' AND column_name = 'supervisor_id'
    `);
    
    if (columnExists.rows.length === 0) {
      console.log('✅ supervisor_id column does not exist, checking for manager_id...');
      
      const managerColumnExists = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'time_entries' AND column_name = 'manager_id'
      `);
      
      if (managerColumnExists.rows.length > 0) {
        console.log('✅ manager_id column already exists, no changes needed');
        return;
      }
    }
    
    // Rename the column
    console.log('📝 Renaming supervisor_id to manager_id...');
    await client.query(`
      ALTER TABLE time_entries 
      RENAME COLUMN supervisor_id TO manager_id
    `);
    
    // Rename the index
    console.log('📝 Renaming index...');
    await client.query(`
      ALTER INDEX IF EXISTS idx_time_entries_supervisor_id 
      RENAME TO idx_time_entries_manager_id
    `);
    
    console.log('✅ Successfully renamed supervisor_id to manager_id');
    
    // Verify the changes
    const newColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'time_entries' AND column_name = 'manager_id'
    `);
    
    if (newColumn.rows.length > 0) {
      console.log('✅ Verification successful: manager_id column exists');
    } else {
      console.log('❌ Verification failed: manager_id column not found');
    }
    
  } catch (error) {
    console.error('❌ Error renaming supervisor_id to manager_id:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
renameSupervisorToManager()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
