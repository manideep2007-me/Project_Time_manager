const pool = require('../src/config/database');
const fs = require('fs');
const path = require('path');

async function addAttachmentTables() {
  try {
    console.log('Adding attachment tables to database...');
    
    // Read the schema file
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Create tables in the correct order to avoid foreign key constraint issues
    console.log('Creating task_uploads table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS task_uploads (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        reviewed_at TIMESTAMP WITH TIME ZONE,
        reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
        review_notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Creating task_attachments table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS task_attachments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        upload_id UUID NOT NULL REFERENCES task_uploads(id) ON DELETE CASCADE,
        original_name VARCHAR(255) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size BIGINT NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        file_extension VARCHAR(10),
        is_image BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Creating indexes...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_task_uploads_task_id ON task_uploads(task_id);
      CREATE INDEX IF NOT EXISTS idx_task_uploads_employee_id ON task_uploads(employee_id);
      CREATE INDEX IF NOT EXISTS idx_task_uploads_status ON task_uploads(status);
      CREATE INDEX IF NOT EXISTS idx_task_uploads_uploaded_at ON task_uploads(uploaded_at);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_task_attachments_upload_id ON task_attachments(upload_id);
      CREATE INDEX IF NOT EXISTS idx_task_attachments_mime_type ON task_attachments(mime_type);
      CREATE INDEX IF NOT EXISTS idx_task_attachments_is_image ON task_attachments(is_image);
    `);
    
    console.log('✅ Attachment tables created successfully!');
    console.log('📋 Tables created:');
    console.log('   - task_uploads (for upload metadata)');
    console.log('   - task_attachments (for file metadata)');
    console.log('   - All necessary indexes');
    
    // Verify tables were created
    const tablesCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('task_uploads', 'task_attachments')
      ORDER BY table_name
    `);
    
    console.log('\n📊 Verification:');
    tablesCheck.rows.forEach(row => {
      console.log(`   ✅ ${row.table_name} table exists`);
    });
    
  } catch (error) {
    console.error('❌ Error adding attachment tables:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the migration
addAttachmentTables()
  .then(() => {
    console.log('\n🎉 Database migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error.message);
    process.exit(1);
  });
