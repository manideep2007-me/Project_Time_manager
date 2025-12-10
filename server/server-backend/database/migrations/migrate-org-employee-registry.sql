-- Migration: Update organizations_registry and employees_registry schema
-- Date: 2025-11-08
-- Changes:
-- 1. Rename unique_id to organization_id in organizations_registry
-- 2. Add organization_id to employees_registry
-- 3. Remove department from employees_registry

-- Begin transaction
BEGIN;

-- Step 1: Rename unique_id to organization_id in organizations_registry
ALTER TABLE organizations_registry 
  RENAME COLUMN unique_id TO organization_id;

-- Step 2: Update index name
DROP INDEX IF EXISTS idx_org_unique_id;
CREATE INDEX IF NOT EXISTS idx_org_organization_id ON organizations_registry(organization_id);

-- Step 3: Add organization_id to employees_registry
ALTER TABLE employees_registry 
  ADD COLUMN IF NOT EXISTS organization_id VARCHAR(50);

-- Step 4: Populate organization_id in employees_registry from organizations_registry
UPDATE employees_registry er
SET organization_id = (
  SELECT or_reg.organization_id 
  FROM organizations_registry or_reg 
  WHERE or_reg.organization_name = er.organization_name
  LIMIT 1
);

-- Step 5: Make organization_id NOT NULL after populating
ALTER TABLE employees_registry 
  ALTER COLUMN organization_id SET NOT NULL;

-- Step 6: Add index for organization_id in employees_registry
CREATE INDEX IF NOT EXISTS idx_emp_org_id ON employees_registry(organization_id);

-- Step 7: Remove department column from employees_registry
ALTER TABLE employees_registry 
  DROP COLUMN IF EXISTS department;

-- Step 8: Update comments
COMMENT ON COLUMN organizations_registry.organization_id IS 'Unique identifier for the organization (e.g., ORG-20251106-ABC12)';
COMMENT ON COLUMN employees_registry.organization_id IS 'Reference to organization_id in organizations_registry';

-- Commit transaction
COMMIT;

-- Verification queries (run these manually to verify)
-- SELECT * FROM organizations_registry LIMIT 5;
-- SELECT * FROM employees_registry LIMIT 5;
-- \d organizations_registry
-- \d employees_registry
