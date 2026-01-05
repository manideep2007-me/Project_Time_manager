-- Migration: Add role and password_hash columns to employees_registry table
-- Database: project_registry
-- This migration adds support for storing organization admins in employees_registry

-- Step 1: Add role column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees_registry' AND column_name = 'role'
  ) THEN
    ALTER TABLE employees_registry ADD COLUMN role VARCHAR(50) DEFAULT 'employee';
  END IF;
END $$;

-- Step 2: Add password_hash column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees_registry' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE employees_registry ADD COLUMN password_hash VARCHAR(255);
  END IF;
END $$;

-- Step 3: Add is_active column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees_registry' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE employees_registry ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Step 4: Create index on role column for faster queries
CREATE INDEX IF NOT EXISTS idx_emp_role ON employees_registry(role);

-- Step 5: Migrate existing organization admins to employees_registry
-- This inserts admin records from organizations_registry into employees_registry
INSERT INTO employees_registry (organization_id, organization_name, employee_email, employee_phone, employee_name, password_hash, role, is_active)
SELECT 
  org.organization_id,
  org.name as organization_name,
  org.admin_email as employee_email,
  org.admin_phone as employee_phone,
  CONCAT('Admin ', org.name) as employee_name,
  org.admin_password as password_hash,
  'admin' as role,
  true as is_active
FROM organizations_registry org
WHERE NOT EXISTS (
  SELECT 1 FROM employees_registry er 
  WHERE er.employee_email = org.admin_email 
  AND er.organization_id = org.organization_id
);

-- Step 6: Add comments for documentation
COMMENT ON COLUMN employees_registry.role IS 'User role: admin, manager, or employee';
COMMENT ON COLUMN employees_registry.password_hash IS 'Hashed password for authentication';
COMMENT ON COLUMN employees_registry.is_active IS 'Whether the employee account is active';

-- Verify migration
SELECT 'Migration completed. Checking results:' as status;
SELECT COUNT(*) as total_employees, 
       COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
       COUNT(CASE WHEN role = 'employee' THEN 1 END) as employees
FROM employees_registry;
