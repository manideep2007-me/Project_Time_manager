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
		console.log('🔧 Updating trigger function to use new rounding logic...\n');
		
		// Drop and recreate the trigger function with NEW rounding logic
		await client.query(`
			CREATE OR REPLACE FUNCTION update_employee_hourly_rate()
			RETURNS TRIGGER AS $$
			BEGIN
				-- Calculate hourly rate: Monthly Salary ÷ 192 hours (24 days × 8 hours)
				-- Round UP to nearest ₹10
				NEW.hourly_rate := CEIL((NEW.salary_amount / 192.0) / 10) * 10;
				RETURN NEW;
			END;
			$$ LANGUAGE plpgsql;
		`);
		
		console.log('✅ Updated trigger function to round UP to nearest ₹10\n');
		
		console.log('🔄 Triggering recalculation by updating all employees...\n');
		
		// Update all employees to trigger the new calculation
		const result = await client.query(`
			UPDATE employees 
			SET updated_at = CURRENT_TIMESTAMP
			RETURNING first_name, last_name, salary_amount, hourly_rate
		`);
		
		console.log('📊 Updated Hourly Rates:\n');
		result.rows.forEach(emp => {
			console.log(`✅ ${emp.first_name} ${emp.last_name}: ₹${emp.salary_amount} -> ₹${emp.hourly_rate}/hr`);
		});
		
		console.log(`\n👷 Updated hourly rates for ${result.rowCount} employees.`);
		console.log('✅ Trigger function now uses new rounding logic!');
		
	} catch (err) {
		console.error('❌ Error:', err.message);
	} finally {
		client.release();
		await pool.end();
	}
}

main();
