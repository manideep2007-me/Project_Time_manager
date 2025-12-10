#!/usr/bin/env node

const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'project_time_manager',
  password: 'Super@123',
  port: 5432
});

async function setRealisticDates() {
  try {
    console.log('🔄 Setting realistic project dates...');
    console.log('====================================');
    
    // Define realistic dates for each status
    const updates = [
      // ACTIVE projects - should have both start and end dates
      { id: 'active_1', start: '2025-08-15', end: '2025-12-15' },
      { id: 'active_2', start: '2025-09-01', end: '2026-01-15' },
      { id: 'active_3', start: '2025-09-20', end: '2026-02-20' },
      { id: 'active_4', start: '2025-10-01', end: '2026-03-01' },
      { id: 'active_5', start: '2025-10-10', end: '2026-01-10' },
      { id: 'active_6', start: '2025-10-20', end: '2026-04-20' },
      { id: 'active_7', start: '2025-11-01', end: '2026-02-01' },
      { id: 'active_8', start: '2025-11-15', end: '2026-05-15' },
      
      // COMPLETED projects - should have both start and end dates (in the past)
      { id: 'completed_1', start: '2025-06-01', end: '2025-08-15' },
      { id: 'completed_2', start: '2025-06-15', end: '2025-09-01' },
      { id: 'completed_3', start: '2025-07-01', end: '2025-09-15' },
      { id: 'completed_4', start: '2025-07-15', end: '2025-10-01' },
      { id: 'completed_5', start: '2025-08-01', end: '2025-10-15' },
      
      // ON_HOLD projects - should have start date, no end date
      { id: 'on_hold_1', start: '2025-09-01', end: null },
      { id: 'on_hold_2', start: '2025-09-15', end: null },
      { id: 'on_hold_3', start: '2025-10-01', end: null },
      { id: 'on_hold_4', start: '2025-10-15', end: null },
      
      // CANCELLED projects - should have both start and end dates (cancellation date)
      { id: 'cancelled_1', start: '2025-07-01', end: '2025-08-15' },
      { id: 'cancelled_2', start: '2025-08-01', end: '2025-09-01' },
      
      // PENDING projects - should have future start date, no end date
      { id: 'pending_1', start: '2025-12-01', end: null },
      { id: 'pending_2', start: '2026-01-01', end: null }
    ];
    
    // Get all projects ordered by status
    const result = await pool.query(`
      SELECT id, name, status 
      FROM projects 
      ORDER BY 
        CASE status 
          WHEN 'active' THEN 1
          WHEN 'completed' THEN 2
          WHEN 'on_hold' THEN 3
          WHEN 'cancelled' THEN 4
          WHEN 'pending' THEN 5
          ELSE 6
        END,
        name
    `);
    
    const projects = result.rows;
    console.log(`📊 Found ${projects.length} projects to update\n`);
    
    // Update each project with appropriate dates
    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      const dateInfo = updates[i];
      
      if (dateInfo) {
        await pool.query(
          'UPDATE projects SET start_date = $1, end_date = $2 WHERE id = $3',
          [dateInfo.start, dateInfo.end, project.id]
        );
        
        console.log(`✅ ${project.name} (${project.status})`);
        console.log(`   Start: ${dateInfo.start}`);
        console.log(`   End: ${dateInfo.end || 'NULL'}`);
        console.log('');
      }
    }
    
    console.log(`🎉 Successfully updated ${projects.length} projects!`);
    
    // Show final summary
    console.log('\n📊 Final Project Summary:');
    console.log('========================');
    
    const summaryResult = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count,
        COUNT(start_date) as with_start_date,
        COUNT(end_date) as with_end_date
      FROM projects 
      GROUP BY status 
      ORDER BY status
    `);
    
    summaryResult.rows.forEach(row => {
      console.log(`\n${row.status.toUpperCase()}: ${row.count} projects`);
      console.log(`  ✅ With start date: ${row.with_start_date}`);
      console.log(`  ${row.with_end_date > 0 ? '✅' : '❌'} With end date: ${row.with_end_date}`);
    });
    
    // Show sample projects with formatted dates
    console.log('\n📋 Sample Projects with Dates:');
    console.log('==============================');
    
    const sampleResult = await pool.query(`
      SELECT name, status, start_date, end_date 
      FROM projects 
      ORDER BY status, name 
      LIMIT 12
    `);
    
    sampleResult.rows.forEach(project => {
      const startDate = project.start_date ? new Date(project.start_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }) : 'NULL';
      
      const endDate = project.end_date ? new Date(project.end_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }) : 'NULL';
      
      console.log(`${project.name} (${project.status})`);
      console.log(`  Start: ${startDate}`);
      console.log(`  End: ${endDate}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error setting realistic dates:', error.message);
  } finally {
    await pool.end();
  }
}

// Run the script
setRealisticDates();
