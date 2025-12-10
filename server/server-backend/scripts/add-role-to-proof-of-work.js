/**
 * Migration: Add user_role column to proof_of_work table
 * This ensures managers and employees have separate proof records
 */

const pool = require('../src/config/database');

async function addRoleToProofOfWork() {
  try {
    console.log('🔧 Starting migration: Add role to proof_of_work table...');

    // Check if table exists, if not create it
    await pool.query(`
      CREATE TABLE IF NOT EXISTS proof_of_work (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        user_role VARCHAR(20) DEFAULT 'employee',
        photo_url TEXT NOT NULL,
        verified_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        accuracy DECIMAL(10, 2) DEFAULT 0,
        integrity_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ proof_of_work table created/verified');

    // Check if user_role column already exists
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='proof_of_work' AND column_name='user_role';
    `);

    if (checkColumn.rows.length === 0) {
      // Add user_role column
      await pool.query(`
        ALTER TABLE proof_of_work 
        ADD COLUMN user_role VARCHAR(20) DEFAULT 'employee';
      `);
      console.log('✅ Added user_role column to proof_of_work table');

      // Update existing records with user roles from users table
      await pool.query(`
        UPDATE proof_of_work 
        SET user_role = users.role::text
        FROM users
        WHERE proof_of_work.user_id = users.id::uuid;
      `);
      console.log('✅ Updated existing records with user roles');
    } else {
      console.log('ℹ️  user_role column already exists');
    }

    // Create index for better query performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_proof_of_work_user_role 
      ON proof_of_work(user_id, user_role);
    `);
    console.log('✅ Created index on user_id and user_role');

    console.log('🎉 Migration completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

addRoleToProofOfWork();
