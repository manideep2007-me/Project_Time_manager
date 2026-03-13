/**
 * Migration: Create pending_registrations table in project_registry database
 * 
 * This table stores employee registration requests that await admin approval.
 * Run once: node scripts/create-pending-registrations-table.js
 */

const { primary: registryPool } = require('../src/config/databases');

async function migrate() {
  try {
    await registryPool.query(`
      CREATE TABLE IF NOT EXISTS pending_registrations (
        id SERIAL PRIMARY KEY,
        organization_id VARCHAR(30) NOT NULL,
        organization_name VARCHAR(255),
        database_name VARCHAR(100),
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(20) DEFAULT 'employee',
        salutation VARCHAR(20),
        date_of_birth DATE,
        designation_id UUID,
        address TEXT,
        country_id UUID,
        state_id UUID,
        city VARCHAR(100),
        zip_code VARCHAR(20),
        aadhaar_number VARCHAR(20),
        joining_date DATE,
        employment_type VARCHAR(20),
        salary_type VARCHAR(20),
        salary_amount NUMERIC(12,2),
        overtime_rate NUMERIC(12,2),
        status VARCHAR(20) DEFAULT 'pending',
        reviewed_by VARCHAR(255),
        reviewed_at TIMESTAMP,
        reject_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(email, organization_id)
      );

      CREATE INDEX IF NOT EXISTS idx_pending_reg_org ON pending_registrations(organization_id);
      CREATE INDEX IF NOT EXISTS idx_pending_reg_status ON pending_registrations(status);
    `);

    console.log('✅ pending_registrations table created successfully');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await registryPool.end();
  }
}

migrate();
