/**
 * Database Service for Dynamic Database Creation
 * 
 * This service handles the creation of per-organization databases.
 * When a new organization is created, a new database (project_time_manager{N})
 * is automatically provisioned with the full schema.
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Master connection (connects to postgres database for admin operations)
const masterConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  database: 'postgres', // Connect to default postgres database for admin operations
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
};

/**
 * Get the next available database number for project_time_manager
 * @returns {Promise<number>} Next database number
 */
async function getNextDatabaseNumber() {
  const pool = new Pool(masterConfig);
  
  try {
    // Query all databases that match the pattern project_time_manager{N}
    const result = await pool.query(`
      SELECT datname FROM pg_database 
      WHERE datname LIKE 'project_time_manager%'
      ORDER BY datname
    `);
    
    let maxNumber = 0;
    
    for (const row of result.rows) {
      const dbName = row.datname;
      // Extract number from database name (e.g., project_time_manager5 -> 5)
      const match = dbName.match(/^project_time_manager(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    }
    
    return maxNumber + 1;
  } finally {
    await pool.end();
  }
}

/**
 * Create a new database for an organization
 * @param {string} databaseName - Name of the database to create
 * @returns {Promise<boolean>} True if successful
 */
async function createDatabase(databaseName) {
  const pool = new Pool(masterConfig);
  
  try {
    // Check if database already exists
    const existing = await pool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [databaseName]
    );
    
    if (existing.rows.length > 0) {
      console.log(`Database ${databaseName} already exists`);
      return true;
    }
    
    // Create the database
    // Note: CREATE DATABASE cannot be run inside a transaction
    await pool.query(`CREATE DATABASE ${databaseName}`);
    console.log(`✅ Created database: ${databaseName}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Failed to create database ${databaseName}:`, error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

/**
 * Initialize the schema in a newly created database
 * @param {string} databaseName - Name of the database to initialize
 * @returns {Promise<boolean>} True if successful
 */
async function initializeSchema(databaseName) {
  const dbPool = new Pool({
    ...masterConfig,
    database: databaseName,
  });
  
  try {
    // Read the schema file
    const schemaPath = path.resolve(__dirname, '../../database/schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the schema
    await dbPool.query(schemaSQL);
    console.log(`✅ Schema initialized for database: ${databaseName}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Failed to initialize schema for ${databaseName}:`, error.message);
    throw error;
  } finally {
    await dbPool.end();
  }
}

/**
 * Seed reference data (countries, states, departments, designations) from project_time_manager
 * @param {string} databaseName - Name of the new database to seed
 * @returns {Promise<boolean>} True if successful
 */
async function seedReferenceData(databaseName) {
  // Connect to source (project_time_manager)
  const sourcePool = new Pool({
    ...masterConfig,
    database: 'project_time_manager',
  });
  
  // Connect to target (new org database)
  const targetPool = new Pool({
    ...masterConfig,
    database: databaseName,
  });
  
  try {
    console.log(`📋 Seeding reference data to ${databaseName}...`);
    
    // Copy countries
    const { rows: countries } = await sourcePool.query(
      'SELECT country_id, name, code, is_active FROM countries'
    );
    for (const c of countries) {
      await targetPool.query(
        `INSERT INTO countries (country_id, name, code, is_active) VALUES ($1, $2, $3, $4)
         ON CONFLICT (country_id) DO NOTHING`,
        [c.country_id, c.name, c.code, c.is_active]
      );
    }
    console.log(`   ✅ Copied ${countries.length} countries`);
    
    // Copy states
    const { rows: states } = await sourcePool.query(
      'SELECT state_id, name, code, country_id, is_active FROM states'
    );
    for (const s of states) {
      await targetPool.query(
        `INSERT INTO states (state_id, name, code, country_id, is_active) VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (state_id) DO NOTHING`,
        [s.state_id, s.name, s.code, s.country_id, s.is_active]
      );
    }
    console.log(`   ✅ Copied ${states.length} states`);
    
    // Copy departments
    const { rows: departments } = await sourcePool.query(
      'SELECT department_id, name, description, is_active FROM departments'
    );
    for (const d of departments) {
      await targetPool.query(
        `INSERT INTO departments (department_id, name, description, is_active) VALUES ($1, $2, $3, $4)
         ON CONFLICT (department_id) DO NOTHING`,
        [d.department_id, d.name, d.description, d.is_active]
      );
    }
    console.log(`   ✅ Copied ${departments.length} departments`);
    
    // Copy designations
    const { rows: designations } = await sourcePool.query(
      'SELECT designation_id, name, description, department_id, is_active FROM designations'
    );
    for (const d of designations) {
      await targetPool.query(
        `INSERT INTO designations (designation_id, name, description, department_id, is_active) VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (designation_id) DO NOTHING`,
        [d.designation_id, d.name, d.description, d.department_id, d.is_active]
      );
    }
    console.log(`   ✅ Copied ${designations.length} designations`);
    
    console.log(`✅ Reference data seeding complete for ${databaseName}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to seed reference data for ${databaseName}:`, error.message);
    // Don't throw - this is non-critical, org can still function
    return false;
  } finally {
    await sourcePool.end();
    await targetPool.end();
  }
}

/**
 * Create an admin user in the organization's database
 * @param {string} databaseName - Name of the organization's database
 * @param {object} adminData - Admin user data
 * @returns {Promise<object>} Created admin user
 */
async function createAdminInOrgDatabase(databaseName, adminData) {
  const dbPool = new Pool({
    ...masterConfig,
    database: databaseName,
  });
  
  try {
    const { email, passwordHash, firstName, lastName, phone } = adminData;
    
    // Create admin user in users table (using correct column names from schema)
    const userResult = await dbPool.query(
      `INSERT INTO users (email_id, password_hash, first_name, last_name, phone_number, role, is_active)
       VALUES ($1, $2, $3, $4, $5, 'admin', true)
       RETURNING user_id, email_id, first_name, last_name, role`,
      [email, passwordHash, firstName, lastName, phone || null]
    );
    
    console.log(`✅ Admin user created in database: ${databaseName}`);
    return userResult.rows[0];
  } catch (error) {
    console.error(`❌ Failed to create admin in ${databaseName}:`, error.message);
    throw error;
  } finally {
    await dbPool.end();
  }
}

/**
 * Create a complete organization database
 * This is the main function called when a new organization is created.
 * 
 * @param {object} orgData - Organization data
 * @param {string} orgData.organizationId - Organization ID (e.g., ORG-20260107-ABC12)
 * @param {string} orgData.name - Organization name
 * @param {string} orgData.adminEmail - Admin email
 * @param {string} orgData.adminPasswordHash - Hashed admin password
 * @param {string} orgData.adminPhone - Admin phone
 * @returns {Promise<object>} Result with database name
 */
async function createOrganizationDatabase(orgData) {
  try {
    // Get next database number
    const dbNumber = await getNextDatabaseNumber();
    const databaseName = `project_time_manager${dbNumber}`;
    
    console.log(`\n📦 Creating organization database: ${databaseName}`);
    console.log(`   Organization: ${orgData.name}`);
    console.log(`   Organization ID: ${orgData.organizationId}`);
    
    // Step 1: Create the database
    await createDatabase(databaseName);
    
    // Step 2: Initialize schema
    await initializeSchema(databaseName);
    
    // Step 3: Seed reference data (countries, states, departments, designations)
    await seedReferenceData(databaseName);
    
    // Step 4: Create admin user in the new database
    const emailParts = orgData.adminEmail.split('@')[0].split(/[._-]/);
    const firstName = emailParts[0] ? emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1) : 'Admin';
    const lastName = emailParts[1] ? emailParts[1].charAt(0).toUpperCase() + emailParts[1].slice(1) : orgData.name.split(' ')[0];
    
    await createAdminInOrgDatabase(databaseName, {
      email: orgData.adminEmail,
      passwordHash: orgData.adminPasswordHash,
      firstName,
      lastName,
      phone: orgData.adminPhone,
    });
    
    console.log(`✅ Organization database setup complete: ${databaseName}\n`);
    
    return {
      success: true,
      databaseName,
      databaseNumber: dbNumber,
    };
  } catch (error) {
    console.error('❌ Failed to create organization database:', error.message);
    throw error;
  }
}

/**
 * Get a connection pool for a specific organization's database
 * @param {string} databaseName - Name of the organization's database
 * @returns {Pool} PostgreSQL connection pool
 */
function getOrganizationPool(databaseName) {
  return new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
    database: databaseName,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
}

/**
 * List all organization databases
 * @returns {Promise<string[]>} List of database names
 */
async function listOrganizationDatabases() {
  const pool = new Pool(masterConfig);
  
  try {
    const result = await pool.query(`
      SELECT datname FROM pg_database 
      WHERE datname LIKE 'project_time_manager%'
      ORDER BY datname
    `);
    
    return result.rows.map(row => row.datname);
  } finally {
    await pool.end();
  }
}

/**
 * Delete an organization's database (use with caution!)
 * @param {string} databaseName - Name of the database to delete
 * @returns {Promise<boolean>} True if successful
 */
async function deleteOrganizationDatabase(databaseName) {
  // Safety check - only allow deletion of project_time_manager{N} databases
  if (!databaseName.match(/^project_time_manager\d+$/)) {
    throw new Error('Can only delete project_time_manager{N} databases');
  }
  
  const pool = new Pool(masterConfig);
  
  try {
    // Terminate all connections to the database
    await pool.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = $1
      AND pid <> pg_backend_pid()
    `, [databaseName]);
    
    // Drop the database
    await pool.query(`DROP DATABASE IF EXISTS ${databaseName}`);
    console.log(`✅ Deleted database: ${databaseName}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Failed to delete database ${databaseName}:`, error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

module.exports = {
  getNextDatabaseNumber,
  createDatabase,
  initializeSchema,
  createAdminInOrgDatabase,
  createOrganizationDatabase,
  getOrganizationPool,
  listOrganizationDatabases,
  deleteOrganizationDatabase,
};
