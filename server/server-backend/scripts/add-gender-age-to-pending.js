/**
 * Migration: Add gender and age columns to pending_registrations table
 * Run once: node scripts/add-gender-age-to-pending.js
 */
const { primary: registryPool } = require('../src/config/databases');

async function migrate() {
  try {
    // Add gender column if it doesn't exist
    await registryPool.query(`
      ALTER TABLE pending_registrations 
      ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
    `);
    console.log('✅ Added gender column');

    // Add age column if it doesn't exist
    await registryPool.query(`
      ALTER TABLE pending_registrations 
      ADD COLUMN IF NOT EXISTS age INTEGER;
    `);
    console.log('✅ Added age column');

    console.log('✅ Migration completed successfully');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await registryPool.end();
  }
}

migrate();
