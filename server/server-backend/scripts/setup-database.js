const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function setupDatabase() {
  const adminPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: 'postgres',
  });

  try {
    const dbName = process.env.DB_NAME || 'project_time_manager';

    const exists = await adminPool.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (exists.rows.length === 0) {
      console.log('Creating database', dbName);
      await adminPool.query(`CREATE DATABASE "${dbName}"`);
    }

    const pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: dbName,
    });

    const schemaPath = path.resolve(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    console.log('Applying schema...');
    await pool.query(schema);
    await pool.end();
    await adminPool.end();
    console.log('Database ready');
  } catch (err) {
    console.error('Setup DB failed:', err.message);
    process.exit(1);
  }
}

setupDatabase();

