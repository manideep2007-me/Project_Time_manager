// Multi-database pool manager for primary and secondary databases

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

/**
 * Create a database pool with environment variable prefix
 * @param {string} prefix - Environment variable prefix (e.g., 'DB' or 'DB2')
 * @param {object} defaults - Default configuration values
 * @returns {Pool} PostgreSQL connection pool
 */
function createPool(prefix, defaults = {}) {
  const config = {
    host: process.env[`${prefix}_HOST`] || defaults.host || 'localhost',
    port: process.env[`${prefix}_PORT`] ? Number(process.env[`${prefix}_PORT`]) : (defaults.port || 5432),
    database: process.env[`${prefix}_NAME`] || defaults.database,
    user: process.env[`${prefix}_USER`] || defaults.user || 'postgres',
    password: String(process.env[`${prefix}_PASSWORD`] || defaults.password || ''),
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };

  const pool = new Pool(config);

  pool.on('connect', () => {
    console.log(`Connected to PostgreSQL database: ${config.database}`);
  });

  pool.on('error', (err) => {
    console.error(`PostgreSQL pool error for ${config.database}:`, err);
  });

  return pool;
}

// Primary database (project_registry) - Master database for organization/employee registry
const primary = createPool('DB', {
  database: 'project_registry',
});

// Secondary database (project_time_manager) - Demo/development database with users table
// Also serves as template for organization-specific databases
// Only initialize if DB2_HOST or DB2_NAME is configured
let secondary = null;
if (process.env.DB2_HOST || process.env.DB2_NAME) {
  const config = {
    host: process.env.DB2_HOST || 'localhost',
    port: process.env.DB2_PORT ? Number(process.env.DB2_PORT) : 5432,
    database: process.env.DB2_NAME || 'project_time_manager',
    user: process.env.DB2_USER || 'postgres',
    password: String(process.env.DB2_PASSWORD || ''),
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };

  secondary = new Pool(config);

  // Don't log on every connection (startup ping in index.js will log once)
  secondary.on('error', (err) => {
    console.error(`PostgreSQL pool error for ${config.database}:`, err);
  });
}

/**
 * Get database pool by name/alias
 * @param {string} name - Pool name ('primary' or 'secondary')
 * @returns {Pool} Database pool
 * @throws {Error} If secondary pool is requested but not configured
 */
function getPool(name = 'primary') {
  if (name === 'primary') {
    return primary;
  }
  
  if (name === 'secondary') {
    if (!secondary) {
      throw new Error('Secondary database is not configured. Set DB2_HOST, DB2_PORT, DB2_NAME, DB2_USER, DB2_PASSWORD in .env');
    }
    return secondary;
  }
  
  throw new Error(`Unknown database pool: ${name}. Valid options: 'primary', 'secondary'`);
}

/**
 * Create a temporary pool connection to a specific organization's database
 * @param {string} databaseName - The organization's database name (e.g., 'project_time_manager1')
 * @returns {Pool} PostgreSQL connection pool for the organization's database
 */
function createOrgPool(databaseName) {
  if (!databaseName) {
    // If no database name specified, use the primary pool
    return primary;
  }
  
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
    database: databaseName,
    user: process.env.DB_USER || 'postgres',
    password: String(process.env.DB_PASSWORD || ''),
    max: 5, // Smaller pool for dynamic connections
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 2000,
  };

  const pool = new Pool(config);
  return pool;
}

module.exports = {
  primary,
  secondary,
  getPool,
  createOrgPool,
};
