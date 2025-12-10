-- Secondary Database Schema for Organization & Employee Registration
-- This database stores registration information separately from the main operational database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations Table
-- Stores all organization registration details
CREATE TABLE IF NOT EXISTS organizations_registry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id VARCHAR(50) UNIQUE NOT NULL,
  organization_name VARCHAR(255) NOT NULL,
  industry VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  country VARCHAR(100) NOT NULL,
  admin_email VARCHAR(255) NOT NULL,
  admin_phone VARCHAR(50) NOT NULL,
  licence_number VARCHAR(100),
  licence_type VARCHAR(50),
  max_employees INTEGER DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Employees Registry Table
-- Stores all employee registrations linked to organizations
CREATE TABLE IF NOT EXISTS employees_registry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id VARCHAR(50) NOT NULL,
  organization_name VARCHAR(255) NOT NULL,
  employee_email VARCHAR(255) NOT NULL,
  employee_phone VARCHAR(50) NOT NULL,
  employee_name VARCHAR(255),
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_name, employee_email)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_org_organization_id ON organizations_registry(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_admin_email ON organizations_registry(admin_email);
CREATE INDEX IF NOT EXISTS idx_org_name ON organizations_registry(organization_name);
CREATE INDEX IF NOT EXISTS idx_emp_email ON employees_registry(employee_email);
CREATE INDEX IF NOT EXISTS idx_emp_org_name ON employees_registry(organization_name);
CREATE INDEX IF NOT EXISTS idx_emp_org_id ON employees_registry(organization_id);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at on organizations_registry
CREATE TRIGGER update_org_registry_updated_at 
  BEFORE UPDATE ON organizations_registry 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE organizations_registry IS 'Registry of all organizations with their details';
COMMENT ON TABLE employees_registry IS 'Registry of all employees linked to organizations';
COMMENT ON COLUMN organizations_registry.organization_id IS 'Unique identifier for the organization (e.g., ORG-20251106-ABC12)';
COMMENT ON COLUMN organizations_registry.industry IS 'Industry type (IT, Manufacturing, Healthcare, etc.)';
COMMENT ON COLUMN employees_registry.organization_id IS 'Reference to organization_id in organizations_registry';
COMMENT ON COLUMN employees_registry.organization_name IS 'Denormalized org name for quick lookups';
