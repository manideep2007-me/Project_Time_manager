#!/usr/bin/env node

const { Pool } = require('pg');
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

function calculateHourlyRate(monthlySalary) {
	if (!monthlySalary || Number.isNaN(Number(monthlySalary))) return 0;
	const hoursPerMonth = 24 * 8; // 24 working days, 8 hours per day
	const raw = Number(monthlySalary) / hoursPerMonth;
	// Round UP to nearest ₹10
	return Math.ceil(raw / 10) * 10;
}

async function main() {
	const client = await pool.connect();
	try {
		console.log('🔄 Recalculating employee hourly rates and recomputing time entry costs...');

		// Start transaction
		await client.query('BEGIN');

		// 1) Update hourly rates for all employees based on monthly salary
		const employees = await client.query(`
			SELECT id, first_name, last_name, salary_amount, hourly_rate
			FROM employees WHERE is_active = true
		`);

		let updatedCount = 0;
		for (const emp of employees.rows) {
			const newRate = calculateHourlyRate(emp.salary_amount);
			await client.query(`UPDATE employees SET hourly_rate = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [newRate, emp.id]);
			updatedCount++;
			console.log(`   ✅ ${emp.first_name} ${emp.last_name}: ₹${emp.salary_amount} -> ₹${newRate}/hr`);
		}
		console.log(`
		👷 Updated hourly rates for ${updatedCount} employees.`);

		// Commit transaction
		await client.query('COMMIT');
		console.log('\n✅ Completed updating hourly rates.');
	} catch (err) {
		await client.query('ROLLBACK');
		console.error('❌ Failed:', err.message);
		process.exitCode = 1;
	} finally {
		client.release();
		await pool.end();
	}
}

main();


