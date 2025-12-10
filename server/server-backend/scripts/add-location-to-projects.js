const pool = require('../src/config/database');

async function addLocationToProjects() {
  try {
    console.log('Adding location column to projects table...');
    
    await pool.query(`
      ALTER TABLE projects 
      ADD COLUMN IF NOT EXISTS location VARCHAR(255)
    `);
    
    console.log('✅ Location column added successfully!');
    
    // Generate unique construction site locations for each project
    const getUniqueLocation = (index, projectName) => {
      // Extract building/block number or use index to create unique locations
      const block = (index % 5) + 1;
      const floor = ['Basement', 'Ground Floor', 'Level 1', 'Level 2', 'Level 3'][index % 5];
      const types = ['Parking Area', 'Parking Zone', 'Parking Floor', 'Parking Section', 'Parking Deck'];
      const type = types[index % types.length];
      
      return `Building ${String.fromCharCode(65 + (index % 26))} - Block ${block}, ${floor} ${type}`;
    };
    
    // Get all projects to assign unique locations
    const result = await pool.query(`
      SELECT id, name FROM projects ORDER BY created_at
    `);
    
    // Assign unique locations to each project
    for (let i = 0; i < result.rows.length; i++) {
      const uniqueLocation = getUniqueLocation(i, result.rows[i].name);
      await pool.query(`UPDATE projects SET location = $1 WHERE id = $2`, [uniqueLocation, result.rows[i].id]);
    }
    
    console.log(`✅ Updated ${result.rows.length} projects with unique construction site locations!`);
    
  } catch (error) {
    console.error('❌ Error adding location column:', error);
  } finally {
    await pool.end();
  }
}

addLocationToProjects();

