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
	console.log('Connecting to database...');
	console.log('Host:', process.env.DB_HOST || 'localhost');
	console.log('Database:', process.env.DB_NAME || 'project_time_manager');
	console.log('User:', process.env.DB_USER || 'postgres');
	
	const client = await pool.connect();
	try {
		// Direct updates with new hourly rates
		console.log('\n🔄 Directly updating hourly rates...\n');
		
		await client.query(`UPDATE employees SET hourly_rate = 1310 WHERE first_name = 'Rajesh' AND last_name = 'Kumar'`);
		console.log('✅ Updated Rajesh Kumar -> ₹1,310/hr');
		
		await client.query(`UPDATE employees SET hourly_rate = 1050 WHERE first_name = 'Bob' AND last_name = 'Williams'`);
		console.log('✅ Updated Bob Williams -> ₹1,050/hr');
		
		await client.query(`UPDATE employees SET hourly_rate = 940 WHERE first_name = 'Ethan' AND last_name = 'Brown'`);
		console.log('✅ Updated Ethan Brown -> ₹940/hr');
		
		await client.query(`UPDATE employees SET hourly_rate = 790 WHERE first_name = 'Alice' AND last_name = 'Johnson'`);
		console.log('✅ Updated Alice Johnson -> ₹790/hr');
		
		await client.query(`UPDATE employees SET hourly_rate = 790 WHERE first_name = 'Charlie' AND last_name = 'Davis'`);
		console.log('✅ Updated Charlie Davis -> ₹790/hr');
		
		await client.query(`UPDATE employees SET hourly_rate = 630 WHERE first_name = 'Diana' AND last_name = 'Smith'`);
		console.log('✅ Updated Diana Smith -> ₹630/hr');
		
		await client.query(`UPDATE employees SET hourly_rate = 530 WHERE first_name = 'Fiona' AND last_name = 'Wilson'`);
		console.log('✅ Updated Fiona Wilson -> ₹530/hr');
		
		// Verify
		const result = await client.query(`SELECT first_name, last_name, hourly_rate FROM employees ORDER BY hourly_rate DESC`);
		console.log('\n📊 Verified Updated Hourly Rates:\n');
		result.rows.forEach(emp => {
			console.log(`${emp.first_name} ${emp.last_name}: ₹${emp.hourly_rate}/hr`);
		});
		
		console.log('\n✅ All hourly rates updated successfully!');
	} catch (err) {
		console.error('❌ Error:', err.message);
	} finally {
		client.release();
		await pool.end();
	}
}

main();
