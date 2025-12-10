-- Simple Database Verification
SELECT 'Tables:' as info;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

SELECT 'Sample Data - Clients:' as info;
SELECT name, email FROM clients LIMIT 3;

SELECT 'Sample Data - Employees:' as info;
SELECT first_name, last_name, employee_id, salary_type FROM employees LIMIT 3;

SELECT 'Sample Data - Projects:' as info;
SELECT name, status FROM projects LIMIT 3;

SELECT 'Functions:' as info;
SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' ORDER BY routine_name;






