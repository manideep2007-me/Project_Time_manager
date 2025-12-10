const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const pool = new Pool({
	host: process.env.DB_HOST || 'localhost',
	port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
	database: process.env.DB_NAME || 'project_time_manager',
	user: process.env.DB_USER || 'postgres',
	password: process.env.DB_PASSWORD,
});

async function main() {
	const client = await pool.connect();
	try {
		console.log('🔍 Checking for triggers on employees table...\n');
		
		const triggers = await client.query(`
			SELECT trigger_name, event_manipulation, action_statement
			FROM information_schema.triggers
			WHERE event_object_table = 'employees'
		`);
		
		if (triggers.rows.length > 0) {
			console.log('⚠️  Found triggers:');
			triggers.rows.forEach(t => {
				console.log(`  - ${t.trigger_name} (${t.event_manipulation})`);
				console.log(`    ${t.action_statement}\n`);
			});
		} else {
			console.log('✅ No triggers found\n');
		}
		
		console.log('🔍 Attempting UPDATE with RETURNING clause...\n');
		const result = await client.query(`
			UPDATE employees 
			SET hourly_rate = 9999.99 
			WHERE first_name = 'Rajesh' 
			RETURNING id, first_name, last_name, hourly_rate
		`);
		
		console.log('UPDATE Result:');
		console.log(result.rows);
		console.log(`Rows affected: ${result.rowCount}`);
		
		console.log('\n🔍 Immediately querying to verify...\n');
		const verify = await client.query(`
			SELECT first_name, last_name, hourly_rate 
			FROM employees 
			WHERE first_name = 'Rajesh'
		`);
		
		console.log('Query Result:');
		console.log(verify.rows);
		
	} catch (err) {
		console.error('❌ Error:', err.message);
	} finally {
		client.release();
		await pool.end();
	}
}

main();
