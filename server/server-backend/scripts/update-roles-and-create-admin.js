#!/usr/bin/env node

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
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

async function updateRolesAndCreateAdmin() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Updating user roles and creating admin user...');
    
    // First, update the enum type to include 'manager' and remove 'supervisor'
    console.log('📝 Updating user_role enum...');
    await client.query(`
      DO $$ 
      BEGIN
        -- Add 'manager' to the enum if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'manager' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
          ALTER TYPE user_role ADD VALUE 'manager';
        END IF;
      END $$;
    `);
    
    // Update existing 'supervisor' users to 'manager'
    console.log('🔄 Converting supervisor users to manager...');
    const updateResult = await client.query(`
      UPDATE users 
      SET role = 'manager' 
      WHERE role = 'supervisor'
    `);
    console.log(`✅ Updated ${updateResult.rowCount} supervisor users to manager`);
    
    // Create admin user if it doesn't exist
    console.log('👤 Creating admin user...');
    const adminEmail = 'admin@company.com';
    const adminPassword = 'admin123';
    
    // Check if admin user already exists
    const existingAdmin = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [adminEmail]
    );
    
    if (existingAdmin.rows.length === 0) {
      // Create new admin user
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      const result = await client.query(`
        INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, email, first_name, last_name, role
      `, [adminEmail, hashedPassword, 'Admin', 'User', 'admin', true]);
      
      console.log('✅ Admin user created successfully:');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
      console.log(`   Role: admin`);
      console.log(`   ID: ${result.rows[0].id}`);
    } else {
      // Update existing admin user role
      await client.query(`
        UPDATE users 
        SET role = 'admin', is_active = true
        WHERE email = $1
      `, [adminEmail]);
      
      console.log('✅ Existing admin user updated to admin role');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
    }
    
    // Verify the changes
    console.log('\n📊 Current user roles:');
    const roleStats = await client.query(`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role 
      ORDER BY role
    `);
    
    roleStats.rows.forEach(row => {
      console.log(`   ${row.role}: ${row.count} users`);
    });
    
    console.log('\n✅ Role update and admin creation completed successfully!');
    
  } catch (error) {
    console.error('❌ Error updating roles and creating admin:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
updateRolesAndCreateAdmin()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
