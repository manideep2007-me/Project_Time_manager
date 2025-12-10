-- Database Verification Script
-- Run this after setting up the database to verify everything is working

-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check if all functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
ORDER BY routine_name;

-- Check if all triggers exist
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
ORDER BY trigger_name;

-- Check sample data
SELECT 'Clients' as table_name, COUNT(*) as record_count FROM clients
UNION ALL
SELECT 'Users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'Employees' as table_name, COUNT(*) as record_count FROM employees
UNION ALL
SELECT 'Projects' as table_name, COUNT(*) as record_count FROM projects;

-- Test cost calculation function
SELECT calculate_hourly_rate('hourly'::salary_type, 25.00) as hourly_rate_test;
SELECT calculate_hourly_rate('daily'::salary_type, 200.00) as daily_rate_test;
SELECT calculate_hourly_rate('monthly'::salary_type, 5000.00) as monthly_rate_test;





